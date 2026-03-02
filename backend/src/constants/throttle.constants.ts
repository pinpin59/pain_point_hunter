export const THROTTLE_PROFILES = {
  default: { limit: 30, ttl: 60_000 },
  auth: { limit: 5, ttl: 60_000 },
  scraping: { limit: 3, ttl: 60_000 },
};
