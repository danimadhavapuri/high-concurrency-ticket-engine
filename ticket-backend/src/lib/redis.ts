import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✔ Connected to Redis instance');
});

redis.on('error', (err) => {
  console.error('✖ Redis Connection Error:', err);
});