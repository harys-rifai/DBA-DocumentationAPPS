const { LogActivity, User } = require('../models/index');
const { Op } = require('sequelize');
const { getCache, setCache, delCacheByPattern } = require('../config/redis');
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

    const where = { flag: true };
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

/**
 * POST /api/logs - Create a new log entry
 */
const create = async (req, res) => {
  try {
    const { action, module, description, status = 'success', userId, username, ipAddress, userAgent } = req.body;

    if (!action) {
      return res.status(400).json({ status: 'error', message: 'Action is required' });
    }

    const logData = {
      action,
      module: module || null,
      description: description || null,
      status,
      flag: 1,
    };

    // Use authenticated user info if available
    if (req.user) {
      logData.user_id = req.user.id;
      logData.username = req.user.username;
    } else if (userId || username) {
      // Allow manual override for system logs
      if (userId) logData.user_id = userId;
      if (username) logData.username = username;
    }

    // Use request info if not provided
    if (ipAddress) logData.ip_address = ipAddress;
    else if (req.ip) logData.ip_address = req.ip;
    else if (req.connection && req.connection.remoteAddress) logData.ip_address = req.connection.remoteAddress;

    if (userAgent) logData.user_agent = userAgent;
    else if (req.headers && req.headers['user-agent']) logData.user_agent = req.headers['user-agent'];

    const log = await LogActivity.create(logData);

    // Invalidate logs cache
    try {
      await delCacheByPattern('logs:list:*');
    } catch (cacheErr) {
      logger.error('Failed to invalidate logs cache:', cacheErr.message);
    }

    return success(res, log, 'Log created successfully', 201);
  } catch (err) {
    logger.error('create log error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create log' });
  }
};

/**
 * POST /api/logs/bulk - Create multiple log entries
 */
const bulkCreate = async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Logs array is required' });
    }

    const logEntries = logs.map(log => ({
      user_id: req.user ? req.user.id : (log.userId || null),
      username: req.user ? req.user.username : (log.username || 'system'),
      action: log.action,
      module: log.module || null,
      description: log.description || null,
      ip_address: log.ipAddress || req.ip || null,
      user_agent: log.userAgent || (req.headers && req.headers['user-agent']) || null,
      status: log.status || 'success',
      flag: 1,
    }));

    const created = await LogActivity.bulkCreate(logEntries);

    // Invalidate logs cache
    try {
      await delCacheByPattern('logs:list:*');
    } catch (cacheErr) {
      logger.error('Failed to invalidate logs cache:', cacheErr.message);
    }

    return success(res, created, `${created.length} logs created successfully`, 201);
  } catch (err) {
    logger.error('bulkCreate logs error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create logs' });
  }
};

module.exports = { getAll, create, bulkCreate };
