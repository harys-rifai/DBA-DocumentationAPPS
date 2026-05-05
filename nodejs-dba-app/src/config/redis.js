require('dotenv').config();
const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASS,
  username: process.env.REDIS_USER,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: false,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis connection established successfully.');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err.message);
});

redis.on('close', () => {
  logger.warn('Redis connection closed.');
});

/**
 * Get value from Redis cache
 * @param {string} key
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis GET error for key "${key}":`, err.message);
    return null;
  }
};

/**
 * Set value in Redis cache
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - seconds
 */
const setCache = async (key, value, ttl = null) => {
  try {
    const expiry = ttl || parseInt(process.env.REDIS_TTL) || 3600;
    await redis.set(key, JSON.stringify(value), 'EX', expiry);
  } catch (err) {
    logger.error(`Redis SET error for key "${key}":`, err.message);
  }
};

/**
 * Delete key from Redis cache
 * @param {string} key
 */
const delCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error(`Redis DEL error for key "${key}":`, err.message);
  }
};

/**
 * Delete keys by pattern
 * @param {string} pattern
 */
const delCacheByPattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Deleted ${keys.length} Redis keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    logger.error(`Redis DEL pattern error for "${pattern}":`, err.message);
  }
};

module.exports = { redis, getCache, setCache, delCache, delCacheByPattern };
