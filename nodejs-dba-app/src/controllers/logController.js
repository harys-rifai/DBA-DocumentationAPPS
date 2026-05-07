const { LogActivity, User } = require('../models/index');
const { Op } = require('sequelize');
const { getCache, setCache } = require('../config/redis');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * GET /api/logs
 */
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const action = req.query.action || null;
    const module = req.query.module || null;
    const since = req.query.since || null; // timestamp in milliseconds

    const cacheKey = `logs:list:${page}:${limit}:${action || 'all'}:${module || 'all'}:${since || 'none'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return success(res, cached, 'Logs fetched from cache');
    }

    const where = {};
    if (action) where.action = action;
    if (module) where.module = module;
    if (since) {
      // since is expected in milliseconds (Unix timestamp)
      const sinceNum = parseInt(since, 10);
      if (!isNaN(sinceNum)) {
        const sinceDate = new Date(sinceNum);
        where.created_at = { [Op.gte]: sinceDate };
      }
    }

    const { count, rows } = await LogActivity.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const result = {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };

    await setCache(cacheKey, result, 60); // short TTL for logs
    return success(res, result);
  } catch (err) {
    logger.error('getAll logs error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
  }
};

module.exports = { getAll };
