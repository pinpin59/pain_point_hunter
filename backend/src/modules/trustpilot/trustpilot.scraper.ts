import type { TrustpilotReview } from '@pain-point-hunter/shared';
import { TrustpilotClient } from './trustpilot.client';

const BASE_URL = 'https://www.trustpilot.com/review';

export interface TrustpilotScrapeParams {
  companies: string[];
  /** Number of pages fetched per company (stars 1 & 2 only). */
  maxPages: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orchestrates Trustpilot scraping across multiple companies and pages.
 *
 * For every company it:
 *  1. Iterates pages 1 → maxPages on the 1★ + 2★ filter URL.
 *  2. Calls TrustpilotClient.scrapePage() for each page.
 *  3. Stops early if a page returns 0 reviews (no more pages).
 *  4. Waits 3 s between pages to avoid bot detection.
 */
export class TrustpilotScraper {
  async scrape(params: TrustpilotScrapeParams): Promise<TrustpilotReview[]> {
    const { companies, maxPages } = params;
    const results: TrustpilotReview[] = [];
    const client = new TrustpilotClient();

    try {
      await client.init();

      for (const company of companies) {
        console.log(`-> Trustpilot: ${company}...`);
        let totalForCompany = 0;

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const url = `${BASE_URL}/${company}?page=${pageNum}&stars=1&stars=2`;
          console.log(`   page ${pageNum}...`);

          try {
            const reviews = await client.scrapePage(url, company);
            console.log(`   ${reviews.length} avis trouvés`);

            if (reviews.length === 0) {
              break;
            }

            results.push(...reviews);
            totalForCompany += reviews.length;

            // Delay between pages to avoid bot detection
            await sleep(3_000);
          } catch (error) {
            console.error(
              `   Erreur ${company} page ${pageNum}:`,
              error instanceof Error ? error.message : String(error),
            );
            // Continue to next page even if one fails
          }
        }

        console.log(`   Total pour ${company}: ${totalForCompany} avis`);
      }
    } finally {
      // Always close the browser, even if an error occurred
      await client.close();
    }

    console.log(`\nTrustpilot: ${results.length} avis au total`);
    return results;
  }
}
