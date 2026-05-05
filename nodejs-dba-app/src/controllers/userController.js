const { User, Role } = require('../models/index');
const { getCache, setCache, delCacheByPattern } = require('../config/redis');
const { success, created, notFound, badRequest } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const logger = require('../utils/logger');

const CACHE_PREFIX = 'users';
const CACHE_TTL = 300; // 5 minutes

/**
 * GET /api/users
 */
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}`;

    // Check Redis cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return success(res, cached, 'Users fetched from cache');
    }

    // Cache MISS - query MySQL
    logger.info(`Cache MISS: ${cacheKey}`);
    const { count, rows } = await User.findAndCountAll({
      where: { flag: 1 },
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
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

    // Store in Redis
    await setCache(cacheKey, result, CACHE_TTL);

    return success(res, result);
  } catch (err) {
    logger.error('getAll users error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};

/**
 * GET /api/users/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `${CACHE_PREFIX}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return success(res, cached);
    }

    logger.info(`Cache MISS: ${cacheKey}`);
    const user = await User.findOne({
      where: { id, flag: 1 },
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) return notFound(res, 'User not found');

    await setCache(cacheKey, user, CACHE_TTL);
    return success(res, user);
  } catch (err) {
    logger.error('getById user error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch user' });
  }
};

/**
 * POST /api/users
 */
const create = async (req, res) => {
  try {
    const { username, password, email, full_name, role_id } = req.body;

    if (!username || !password) {
      return badRequest(res, 'Username and password are required');
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) return badRequest(res, 'Username already exists');

    const user = await User.create({ username, password, email, full_name, role_id, flag: 1 });

    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'CREATE', 'users', `Created user: ${username}`);

    const { password: _, ...userData } = user.toJSON();
    return created(res, userData, 'User created successfully');
  } catch (err) {
    logger.error('create user error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create user' });
  }
};

/**
 * PUT /api/users/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, active, role_id } = req.body;

    const user = await User.findOne({ where: { id, flag: 1 } });
    if (!user) return notFound(res, 'User not found');

    await user.update({ email, full_name, active, role_id });

    // Invalidate cache
    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'UPDATE', 'users', `Updated user ID: ${id}`);

    const { password: _, ...userData } = user.toJSON();
    return success(res, userData, 'User updated successfully');
  } catch (err) {
    logger.error('update user error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update user' });
  }
};

/**
 * DELETE /api/users/:id  (soft delete)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ where: { id, flag: 1 } });
    if (!user) return notFound(res, 'User not found');

    await user.update({ flag: 0, active: 0 });

    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'DELETE', 'users', `Soft-deleted user ID: ${id}`);

    return success(res, null, 'User deleted successfully');
  } catch (err) {
    logger.error('delete user error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete user' });
  }
};

module.exports = { getAll, getById, create, update, remove };
