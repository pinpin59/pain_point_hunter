import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedditService } from './reddit.service';
import { SUBREDDITS } from '@pain-point-hunter/shared';
import { FetchSubredditsBodyDto } from './dto/reddit.dto';

@ApiTags('reddit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reddit')
export class RedditController {
  constructor(private readonly redditService: RedditService) {}

  @ApiOperation({ summary: 'Liste des subreddits suggérés', description: 'Retourne la liste des subreddits préconfigurés à utiliser comme suggestions côté frontend.' })
  @ApiOkResponse({
    description: 'Liste des subreddits disponibles',
    schema: {
      type: 'object',
      properties: {
        subreddits: { type: 'array', items: { type: 'string' }, example: ['SaaS', 'Entrepreneur', 'startups'] },
      },
    },
  })
  @Get('subreddits')
  getAvailableSubreddits() {
    return { subreddits: SUBREDDITS };
  }

  @ApiOperation({
    summary: 'Scraper des posts Reddit',
    description: 'Récupère les posts hot + new + top(month) de chaque subreddit fourni, déduplique par ID, et retourne uniquement les posts dont le titre ou le contenu contient au moins un des keywords fournis.',
  })
  @ApiBody({
    type: FetchSubredditsBodyDto,
    examples: {
      default: {
        summary: 'Exemple standard',
        value: { subreddits: ['SaaS', 'Entrepreneur', 'startups'], keywords: ['i hate', 'why is there no', "i'm frustrated", "j'en ai marre"], limit: 25 },
      },
      minimal: {
        summary: 'Minimal (limit par défaut = 25)',
        value: { subreddits: ['webdev'], keywords: ['pain in the ass', 'it sucks'] },
      },
    },
  })
  @ApiOkResponse({
    description: 'Posts récupérés avec succès',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'abc123' },
          subreddit: { type: 'string', example: 'SaaS' },
          title: { type: 'string', example: 'Why is onboarding so hard?' },
          selftext: { type: 'string', example: 'I keep losing users after sign-up...' },
          author: { type: 'string', example: 'u/john_doe' },
          score: { type: 'number', example: 142 },
          numComments: { type: 'number', example: 37 },
          url: { type: 'string', example: 'https://reddit.com/r/SaaS/comments/abc123' },
          createdAt: { type: 'number', example: 1700000000 },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('posts')
  getPosts(@Body() body: FetchSubredditsBodyDto) {
    return this.redditService.fetchPosts(body);
  }

  @ApiOperation({
    summary: 'Scraper + exporter en Excel',
    description: 'Même logique que POST /posts mais retourne directement un fichier .xlsx téléchargeable. Un onglet global + un onglet par subreddit, triés par score.',
  })
  @ApiBody({
    type: FetchSubredditsBodyDto,
    examples: {
      default: {
        summary: 'Exemple',
        value: { subreddits: ['SaaS', 'Entrepreneur'], keywords: ['pain point', 'struggle', 'frustrating'], limit: 50 },
      },
    },
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOkResponse({ description: 'Fichier Excel (.xlsx) en téléchargement' })
  @HttpCode(HttpStatus.OK)
  @Post('export')
  async exportPosts(@Body() body: FetchSubredditsBodyDto, @Res() res: Response) {
    const buffer = await this.redditService.exportPosts(body);
    const filename = `pain_points_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
