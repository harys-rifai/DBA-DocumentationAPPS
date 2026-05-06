const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, aiUpdateAll, aiUpdateSingle, getDbTypes, toggleAutoUpdate } = require('../controllers/dokumentasiController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getAll);                                              // public
router.get('/db-types', getDbTypes);                                  // public
router.get('/:id', getById);                                          // public
router.post('/', authenticate, authorize('admin', 'dba'), create);
router.put('/:id', authenticate, authorize('admin', 'dba'), update);
router.delete('/:id', authenticate, authorize('admin'), remove);
router.post('/ai-update/all', authenticate, authorize('admin', 'dba'), aiUpdateAll);
router.post('/ai-update/:dbType', authenticate, authorize('admin', 'dba'), aiUpdateSingle);
router.put('/:id/toggle-auto-update', authenticate, authorize('admin', 'dba'), toggleAutoUpdate);

module.exports = router;
