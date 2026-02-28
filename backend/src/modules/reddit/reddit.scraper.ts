import type { RedditPost } from '@pain-point-hunter/shared';
import type { RedditClient, RedditFeed } from './reddit.client';

export interface ScrapeParams {
  subreddits: string[];
  keywords: string[];
  /** Max posts fetched per subreddit per feed (hot / new / top). */
  limit: number;
}

/** All three feeds scraped per subreddit to maximise coverage. */
const FEEDS: RedditFeed[] = ['hot', 'new', 'top'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Loops over every subreddit, fetches hot + new + top(month),
 * deduplicates by post ID, and returns all posts found.
 */
export class RedditScraper {
  constructor(private readonly client: RedditClient) {}

  async scrape(params: ScrapeParams): Promise<RedditPost[]> {
    const { subreddits, keywords, limit } = params;
    const results: RedditPost[] = [];

    for (const subredditName of subreddits) {
      console.log(`-> r/${subredditName}...`);

      try {
        const seenIds = new Set<string>();
        const uniquePosts: Omit<RedditPost, 'matchedKeyword'>[] = [];

        for (const feed of FEEDS) {
          const posts = await this.client.fetchFeed(subredditName, feed, limit);

          for (const post of posts) {
            if (!seenIds.has(post.id)) {
              seenIds.add(post.id);
              uniquePosts.push(post);
            }
          }
        }

        // Keyword filtering — only keep posts that match at least one pain keyword
        for (const post of uniquePosts) {
          const text = `${post.title} ${post.selftext}`.toLowerCase();
          const matchedKeyword = keywords.find((kw) => text.includes(kw.toLowerCase()));
          if (matchedKeyword) {
            results.push({ ...post, matchedKeyword });
          }
        }

        console.log(`   r/${subredditName}: ${seenIds.size} scanned, ${results.length} matches so far`);

        // 1 s entre chaque subreddit pour respecter le rate limit Reddit
        await sleep(1000);
      } catch (error) {
        console.error(`   Erreur r/${subredditName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log(`\nReddit: ${results.length} posts au total`);
    return results;
  }
}
