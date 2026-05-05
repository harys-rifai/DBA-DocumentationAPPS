const { DocumentasiDB } = require('../models/index');
const { getCache, setCache, delCacheByPattern } = require('../config/redis');
const { success, created, notFound, badRequest } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const logger = require('../utils/logger');

const CACHE_PREFIX = 'dokumentasi';
const CACHE_TTL = 600; // 10 minutes

/**
 * GET /api/dokumentasi
 */
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const db_type = req.query.db_type || null;

    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${db_type || 'all'}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return success(res, cached, 'Dokumentasi fetched from cache');
    }

    logger.info(`Cache MISS: ${cacheKey}`);

    const where = { flag: 1 };
    if (db_type) where.db_type = db_type;

    const { count, rows } = await DocumentasiDB.findAndCountAll({
      where,
      limit,
      offset,
      order: [['rank', 'ASC'], ['created_at', 'DESC']],
      attributes: { exclude: ['tutorial'] }, // exclude heavy content in list
    });

    const result = {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return success(res, result);
  } catch (err) {
    logger.error('getAll dokumentasi error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch dokumentasi' });
  }
};

/**
 * GET /api/dokumentasi/:id
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
    const doc = await DocumentasiDB.findOne({ where: { id, flag: 1 } });
    if (!doc) return notFound(res, 'Dokumentasi not found');

    await setCache(cacheKey, doc, CACHE_TTL);
    return success(res, doc);
  } catch (err) {
    logger.error('getById dokumentasi error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch dokumentasi' });
  }
};

/**
 * POST /api/dokumentasi
 */
const create = async (req, res) => {
  try {
    const { db_type, title, tutorial, summary, rank, tags } = req.body;

    if (!db_type || !title) {
      return badRequest(res, 'db_type and title are required');
    }

    const doc = await DocumentasiDB.create({
      db_type,
      title,
      tutorial,
      summary,
      rank: rank || 0,
      tags,
      author_id: req.user ? req.user.id : null,
      flag: 1,
    });

    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'CREATE', 'dokumentasi', `Created: ${title}`);

    return created(res, doc, 'Dokumentasi created successfully');
  } catch (err) {
    logger.error('create dokumentasi error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to create dokumentasi' });
  }
};

/**
 * PUT /api/dokumentasi/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { db_type, title, tutorial, summary, rank, tags, flag } = req.body;

    const doc = await DocumentasiDB.findOne({ where: { id } });
    if (!doc) return notFound(res, 'Dokumentasi not found');

    await doc.update({ db_type, title, tutorial, summary, rank, tags, flag });

    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'UPDATE', 'dokumentasi', `Updated ID: ${id}`);

    return success(res, doc, 'Dokumentasi updated successfully');
  } catch (err) {
    logger.error('update dokumentasi error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update dokumentasi' });
  }
};

/**
 * DELETE /api/dokumentasi/:id  (soft delete)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await DocumentasiDB.findOne({ where: { id, flag: 1 } });
    if (!doc) return notFound(res, 'Dokumentasi not found');

    await doc.update({ flag: 0 });

    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'DELETE', 'dokumentasi', `Deleted ID: ${id}`);

    return success(res, null, 'Dokumentasi deleted successfully');
  } catch (err) {
    logger.error('delete dokumentasi error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to delete dokumentasi' });
  }
};

module.exports = { getAll, getById, create, update, remove };
