import { chromium, type Browser, type Page } from 'playwright';
import type { TrustpilotReview } from '@pain-point-hunter/shared';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Raw shape extracted from the DOM before validation. */
interface RawReview {
  title: string;
  body: string;
  stars: string;
  date: string;
}

/**
 * Thin Playwright wrapper.
 * Manages the browser lifecycle and exposes a single method to scrape
 * one Trustpilot page URL, returning the reviews found on it.
 *
 * Usage:
 *   const client = new TrustpilotClient();
 *   await client.init();
 *   const reviews = await client.scrapePage(url, company);
 *   await client.close();
 */
export class TrustpilotClient {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(headless = true): Promise<void> {
    this.browser = await chromium.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled', // cache le flag webdriver
        '--disable-infobars',
        '--window-size=1280,800',
      ],
    });
    const context = await this.browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      locale: 'fr-FR',
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });
    // Masque navigator.webdriver = true (détecté par Trustpilot)
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    this.page = await context.newPage();
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }

  /**
   * Navigates to `url`, waits for the page to settle, then extracts all
   * review cards found on the page.
   *
   * @param url      Full Trustpilot review page URL (with star filters + page param)
   * @param company  Company slug used to build the canonical review URL
   */
  async scrapePage(url: string, company: string): Promise<TrustpilotReview[]> {
    if (!this.page) throw new Error('TrustpilotClient not initialised — call init() first');

    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });

    // Fermer le bandeau cookie si présent
    try {
      const cookieBtn = this.page.locator('#onetrust-accept-btn-handler, button[id*="accept"]');
      await cookieBtn.first().click({ timeout: 3_000 });
      await this.page.waitForTimeout(500);
    } catch {
      // Pas de bandeau cookie, on continue
    }

    // Attendre que les cartes d'avis soient présentes dans le DOM
    const cardSelector = '[data-service-review-card-paper], article.paper_paper__EciTx';
    try {
      await this.page.waitForSelector(cardSelector, { timeout: 10_000 });
    } catch {
      console.warn(`   Aucune carte trouvée sur ${url} (page protégée ou vide)`);
      return [];
    }

    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1_500);

    const rawCards = await this.page.evaluate(() => {
      // Try both known selectors for the review card wrapper
      const cards =
        document.querySelectorAll('[data-service-review-card-paper]').length > 0
          ? document.querySelectorAll('[data-service-review-card-paper]')
          : document.querySelectorAll('article.paper_paper');

      const results: { title: string; body: string; stars: string; date: string }[] = [];

      cards.forEach((card) => {
        try {
          const titleEl = card.querySelector('h2');
          const title = titleEl?.textContent?.trim() ?? '';

          // Try both known selectors for review body
          const bodyEl =
            card.querySelector('p[data-service-review-text-typography]') ??
            card.querySelector('.typography_body-l__KUYFJ');
          const body = bodyEl?.textContent?.trim() ?? '';

          const starsEl = card.querySelector('[data-service-review-rating]');
          const stars = starsEl?.getAttribute('data-service-review-rating') ?? '1-2';

          const dateEl = card.querySelector('time');
          const date = dateEl?.getAttribute('datetime')?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

          // Ignore reviews with very short body (likely placeholder text)
          if (body.length > 30) {
            results.push({ title, body, stars, date });
          }
        } catch {
          // Skip malformed cards silently
        }
      });

      return results;
    });

    return rawCards.map((raw: RawReview) => ({
      company,
      title: raw.title,
      body: raw.body,
      url: `https://www.trustpilot.com/review/${company}`,
      stars: raw.stars,
      date: raw.date,
    }));
  }
}
