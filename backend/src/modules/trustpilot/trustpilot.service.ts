import { Injectable } from '@nestjs/common';
import type { TrustpilotReview, FetchTrustpilotBody } from '@pain-point-hunter/shared';
import { TrustpilotScraper } from './trustpilot.scraper';
import { exportTrustpilotToExcel } from './trustpilot.exporter';
import type { FetchTrustpilotBodyDto } from './dto/trustpilot.dto';

@Injectable()
export class TrustpilotService {
  async fetchReviews(body: FetchTrustpilotBodyDto): Promise<TrustpilotReview[]> {
    const params = body as unknown as FetchTrustpilotBody;
    const scraper = new TrustpilotScraper();
    return scraper.scrape({
      companies: params.companies,
      maxPages: params.maxPages,
    });
  }

  async exportReviews(body: FetchTrustpilotBodyDto): Promise<Buffer> {
    const reviews = await this.fetchReviews(body);
    return exportTrustpilotToExcel(reviews);
  }
}
