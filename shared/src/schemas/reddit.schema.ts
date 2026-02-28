import { z } from 'zod';

export const RedditPostSchema = z.object({
  id: z.string(),
  subreddit: z.string(),
  title: z.string(),
  selftext: z.string(),
  author: z.string(),
  score: z.number(),
  numComments: z.number(),
  url: z.string(),
  createdAt: z.number(),
  matchedKeyword: z.string(),
});



export const FetchSubredditsBodySchema = z.object({
  subreddits: z.array(z.string().min(1)).min(1, 'At least one subreddit is required'),
  keywords: z.array(z.string().min(1)).min(1, 'At least one keyword is required'),
  limit: z.number().min(1).max(100).default(25),
});

export type RedditPost = z.infer<typeof RedditPostSchema>;
export type FetchSubredditsBody = z.infer<typeof FetchSubredditsBodySchema>;
