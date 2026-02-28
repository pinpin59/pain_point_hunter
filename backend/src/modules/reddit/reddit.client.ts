import axios from 'axios';
import type { RedditPost } from '@pain-point-hunter/shared';

const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_BASE = 'https://oauth.reddit.com';

export type RedditFeed = 'hot' | 'new' | 'top';

/** Raw shape of a single post child from the Reddit JSON API. */
interface RedditRawPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  permalink: string;
  created_utc: number;
}

interface RedditTokenResponse {
  access_token: string;
  expires_in: number; // seconds
}

/**
 * Thin wrapper around the Reddit OAuth API.
 * Handles token acquisition (app-only / client_credentials) and caches it
 * until 60 s before expiry to avoid mid-request refreshes.
 */
export class RedditClient {
  private token: string | null = null;
  private tokenExpiresAt = 0; // unix ms

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly userAgent: string,
  ) {}

  /** Returns a valid Bearer token, refreshing it when necessary. */
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await axios.post<RedditTokenResponse>(
      REDDIT_TOKEN_URL,
      'grant_type=client_credentials',
      {
        auth: { username: this.clientId, password: this.clientSecret },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
      },
    );

    this.token = response.data.access_token;
    // Refresh 60 s before actual expiry to stay safe
    this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.token;
  }

  /**
   * Fetches up to `limit` posts from a subreddit feed (hot / new / top).
   * For `top`, the default time window is `month` (same as the Python script).
   */
  async fetchFeed(subreddit: string, feed: RedditFeed, limit: number): Promise<Omit<RedditPost, 'matchedKeyword'>[]> {
    const token = await this.getToken();

    const params: Record<string, string | number> = { limit, raw_json: 1 };
    if (feed === 'top') params.t = 'month';

    const response = await axios.get<{ data: { children: Array<{ data: RedditRawPost }> } }>(
      `${REDDIT_API_BASE}/r/${subreddit}/${feed}`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': this.userAgent,
        },
      },
    );

    const children = response.data?.data?.children ?? [];
    return children.map(({ data }) => this.mapPost(data));
  }

  /** Maps a raw Reddit API post to our shared `RedditPost` shape (without matchedKeyword). */
  private mapPost(raw: RedditRawPost): Omit<RedditPost, 'matchedKeyword'> {
    return {
      id: raw.id,
      subreddit: raw.subreddit,
      title: raw.title,
      selftext: raw.selftext ?? '',
      author: raw.author,
      score: raw.score,
      numComments: raw.num_comments,
      // Build full permalink URL (same format as the Python script)
      url: `https://reddit.com${raw.permalink}`,
      createdAt: raw.created_utc,
    };
  }
}
