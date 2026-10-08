import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const createRedisClient = () => {
  let redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redisUrl = redisUrl.trim();
    // Auto-extract URL if user pasted the full 'redis-cli --tls -u ...' command
    const urlMatch = redisUrl.match(/(rediss?:\/\/[^\s"']+)/);
    if (urlMatch) {
      redisUrl = urlMatch[1];
    }
    // Upstash and cloud providers require TLS
    const isTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash.io');
    if (isTls && redisUrl.startsWith('redis://')) {
      redisUrl = redisUrl.replace(/^redis:\/\//, 'rediss://');
    }

    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  });
};

const connection = createRedisClient();
const publisher = createRedisClient();

connection.on('connect', () => {
  console.log('[Worker-Node] Connected to Redis queue connection');
});

publisher.on('connect', () => {
  console.log('[Worker-Node] Connected to Redis Pub/Sub publisher');
});

connection.on('error', (err) => console.error('[Worker-Node] Redis Connection Error:', err.message));
publisher.on('error', (err) => console.error('[Worker-Node] Redis Publisher Error:', err.message));

export {
  connection,
  publisher,
};
