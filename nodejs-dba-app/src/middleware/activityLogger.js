const { LogActivity } = require('../models/index');
const { delCacheByPattern } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Log user activity to database
 * @param {string} action
 * @param {string} module
 * @param {string} status
 */
const logActivity = async (req, action, module, description = '', status = 'success') => {
  try {
    await LogActivity.create({
      user_id: req.user ? req.user.id : null,
      username: req.user ? req.user.username : 'anonymous',
      action,
      module,
      description,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      status,
      flag: 1,
    });
  } catch (err) {
    logger.error('Failed to log activity:', err.message);
    return; // Don't proceed to cache invalidation if log failed
  }
  // Invalidate logs list cache to ensure fresh data (especially for notification badges)
  try {
    await delCacheByPattern('logs:list:*');
  } catch (err) {
    logger.error('Failed to invalidate logs cache:', err.message);
  }
};

module.exports = { logActivity };
