import { Body, Controller, Post, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

const TRUSTPILOT_EXAMPLE = {
  companies: ['mailchimp.com', 'hubspot.com'],
  maxPages: 3,
};
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrustpilotService } from './trustpilot.service';
import { FetchTrustpilotBodyDto } from './dto/trustpilot.dto';
import { THROTTLE_PROFILES } from 'src/constants/throttle.constants';

@ApiTags('Trustpilot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trustpilot')
export class TrustpilotController {
  constructor(private readonly trustpilotService: TrustpilotService) {}

  @Throttle({ scraping: THROTTLE_PROFILES.scraping })
  @Post('reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scrape Trustpilot reviews (1★ & 2★) for given companies' })
  @ApiBody({ type: FetchTrustpilotBodyDto, examples: { default: { value: TRUSTPILOT_EXAMPLE } } })
  async fetchReviews(@Body() body: FetchTrustpilotBodyDto) {
    const reviews = await this.trustpilotService.fetchReviews(body);
    return { count: reviews.length, reviews };
  }

  @Throttle({ scraping: THROTTLE_PROFILES.scraping })
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scrape Trustpilot reviews and export as Excel file' })
  @ApiBody({ type: FetchTrustpilotBodyDto, examples: { default: { value: TRUSTPILOT_EXAMPLE } } })
  async exportReviews(@Body() body: FetchTrustpilotBodyDto, @Res() res: Response) {
    const buffer = await this.trustpilotService.exportReviews(body);
    const filename = `trustpilot_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
