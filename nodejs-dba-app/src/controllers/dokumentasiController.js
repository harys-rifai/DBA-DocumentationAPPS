const { RunbookAI } = require('../models/index');
const { Op } = require('sequelize');
const { getCache, setCache, delCacheByPattern } = require('../config/redis');
const { success, created, notFound, badRequest } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');
const logger = require('../utils/logger');
const { updateAllDatabases, updateSingleDatabase, DB_TYPES } = require('../services/aiService');

const CACHE_PREFIX = 'dokumentasi';
const CACHE_TTL = 600; // 10 minutes

// Valid sort columns (whitelist to prevent SQL injection)
const SORT_COLS = ['id', 'title', 'db_type', 'rank', 'createdAt', 'updatedAt'];

/**
 * GET /api/dokumentasi
 * Query params: page, limit, db_type, search, sort, order
 */
const getAll = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const db_type = req.query.db_type || null;
    const search  = req.query.search  || req.query.q || null;
    const sortCol = SORT_COLS.includes(req.query.sort) ? req.query.sort : 'rank';
    const sortDir = req.query.order === 'desc' ? 'DESC' : 'ASC';

    const cacheKey = `${CACHE_PREFIX}:list:${page}:${limit}:${db_type||'all'}:${search||''}:${sortCol}:${sortDir}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      logger.info(`Cache HIT: ${cacheKey}`);
      return success(res, cached, 'Dokumentasi fetched from cache');
    }

    logger.info(`Cache MISS: ${cacheKey}`);

    const where = { flag: 1 };
    if (db_type) {
      where.db_type = db_type;
      // Treat 'sqlserver' as matching both 'sqlserver' and 'mssql'
      if (db_type === 'sqlserver') {
        where.db_type = { [Op.in]: ['sqlserver', 'mssql'] };
      }
    }
    if (search) {
      where[Op.or] = [
        { title:   { [Op.like]: `%${search}%` } },
        { summary: { [Op.like]: `%${search}%` } },
      ];
    }

    const order = sortCol === 'rank'
      ? [['rank', sortDir], ['createdAt', 'DESC']]
      : [[sortCol, sortDir]];

    const { count, rows } = await RunbookAI.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: { exclude: ['tutorial'] },
    });

    const result = {
      total:      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      sort:       sortCol,
      order:      sortDir,
      data:       rows,
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
    const doc = await RunbookAI.findOne({ where: { id, flag: 1 } });
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
    const { db_type, title, summary, rank, tags } = req.body;
    const tutorial = req.body.tutorial || req.body.tutor || null;

    if (!db_type || !title) {
      return badRequest(res, 'db_type and title are required');
    }

    const doc = await RunbookAI.create({
      db_type,
      title,
      tutorial,
      summary,
      rank: rank || 0,
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []),
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
    const { db_type, title, summary, rank, tags, flag } = req.body;
    const tutorial = req.body.tutorial || req.body.tutor;

    const doc = await RunbookAI.findOne({ where: { id } });
    if (!doc) return notFound(res, 'Dokumentasi not found');

    const parsedTags = Array.isArray(tags)
      ? tags
      : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : doc.tags);

    await doc.update({ db_type, title, tutorial, summary, rank, tags: parsedTags, flag });

    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await logActivity(req, 'UPDATE', 'dokumentasi', `Updated ID: ${id} — ${title || doc.title}`);

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

    const doc = await RunbookAI.findOne({ where: { id, flag: 1 } });
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

/**
 * POST /api/dokumentasi/ai-update/all
 * Trigger AI update for all database types
 */
const aiUpdateAll = async (req, res) => {
  try {
    const results = await updateAllDatabases(req);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    return success(res, results, `AI update completed: ${results.updated} updated, ${results.skipped} skipped`);
  } catch (err) {
    logger.error('AI update all error:', err.message);
    return res.status(500).json({ status: 'error', message: 'AI update failed' });
  }
};

/**
 * POST /api/dokumentasi/ai-update/:dbType
 * Trigger AI update for specific database type
 */
const aiUpdateSingle = async (req, res) => {
  try {
    const { dbType } = req.params;
    const doc = await updateSingleDatabase(dbType, req);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    await delCacheByPattern(`${CACHE_PREFIX}:${doc.id}`);
    return success(res, doc, `AI update completed for ${dbType}`);
  } catch (err) {
    logger.error('AI update single error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/dokumentasi/db-types
 * Get all supported database types with version info
 */
const getDbTypes = async (req, res) => {
  try {
    const types = DB_TYPES.map(db => ({
      type: db.type,
      name: db.name,
      currentVersion: db.currentVersion,
    }));
    return success(res, types, 'Database types fetched');
  } catch (err) {
    logger.error('getDbTypes error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch database types' });
  }
};

/**
 * PUT /api/dokumentasi/:id/toggle-auto-update
 * Toggle auto-update for a documentation entry
 */
const toggleAutoUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await RunbookAI.findOne({ where: { id } });
    if (!doc) return notFound(res, 'Dokumentasi not found');
    
    const newStatus = doc.auto_update === 1 ? 0 : 1;
    await doc.update({ auto_update: newStatus });
    
    await delCacheByPattern(`${CACHE_PREFIX}:${id}`);
    await delCacheByPattern(`${CACHE_PREFIX}:list:*`);
    
    return success(res, { auto_update: newStatus }, 
      `Auto-update ${newStatus ? 'enabled' : 'disabled'}`);
  } catch (err) {
    logger.error('toggleAutoUpdate error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Failed to toggle auto-update' });
  }
};

module.exports = { getAll, getById, create, update, remove, aiUpdateAll, aiUpdateSingle, getDbTypes, toggleAutoUpdate };
