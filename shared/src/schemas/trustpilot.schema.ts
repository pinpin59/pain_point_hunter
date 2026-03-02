import { z } from 'zod';

export const TrustpilotReviewSchema = z.object({
  company: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string(),
  stars: z.string(),
  date: z.string(), // YYYY-MM-DD
});

export const FetchTrustpilotBodySchema = z.object({
  companies: z
    .array(z.string().min(1))
    .min(1, 'At least one company is required')
    .describe('Slugs Trustpilot = nom de domaine de l\'entreprise (ex: mailchimp.com, hubspot.com)'),
  maxPages: z.number().min(1).max(20).default(3),
});

export type TrustpilotReview = z.infer<typeof TrustpilotReviewSchema>;
export type FetchTrustpilotBody = z.infer<typeof FetchTrustpilotBodySchema>;
