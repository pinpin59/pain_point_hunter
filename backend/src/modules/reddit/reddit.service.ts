import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FetchSubredditsBody, RedditPost } from '@pain-point-hunter/shared';
import { RedditClient } from './reddit.client';
import { RedditScraper } from './reddit.scraper';
import { exportToExcel } from './reddit.exporter';
import { FetchSubredditsBodyDto } from './dto/reddit.dto';

@Injectable()
export class RedditService {
  private readonly scraper: RedditScraper;

  constructor(private readonly configService: ConfigService) {
    const client = new RedditClient(
      configService.getOrThrow<string>('REDDIT_CLIENT_ID'),
      configService.getOrThrow<string>('REDDIT_CLIENT_SECRET'),
      configService.get<string>('REDDIT_USER_AGENT', 'PainPointScraper/1.0'),
    );

    this.scraper = new RedditScraper(client);
  }

  fetchPosts(body: FetchSubredditsBodyDto): Promise<RedditPost[]> {
    const params = body as unknown as FetchSubredditsBody;

    return this.scraper.scrape({
      subreddits: params.subreddits,
      keywords: params.keywords,
      limit: params.limit,
    });
  }

  async exportPosts(body: FetchSubredditsBodyDto): Promise<Buffer> {
    const posts = await this.fetchPosts(body);
    return exportToExcel(posts);
  }
}
