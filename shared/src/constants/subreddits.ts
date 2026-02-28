export const SUBREDDITS = [
  // SaaS / Tech
  'SaaS', 'entrepreneur', 'startups', 'indiehackers', 'webdev',
  'programming', 'devops', 'MachineLearning', 'artificial',
  // PME / Business
  'smallbusiness', 'Entrepreneur', 'freelance', 'selfemployed',
  'realestate', 'Accounting', 'legaladvice',
  // Createurs / Freelances
  'NewTubers', 'podcasting', 'blogging', 'content_marketing',
  'freelanceWriters', 'graphic_design', 'UXDesign',
  // E-commerce
  'ecommerce', 'shopify', 'Etsy', 'FulfillmentByAmazon',
  'dropship', 'affiliatemarketing',
  // Productivite / No-code
  'productivity', 'Notion', 'nocode', 'automation',
] as const;

export type Subreddit = typeof SUBREDDITS[number];
