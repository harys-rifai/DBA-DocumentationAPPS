const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/dokumentasiController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getAll);                                              // public
router.get('/:id', getById);                                          // public
router.post('/', authenticate, authorize('admin', 'dba'), create);
router.put('/:id', authenticate, authorize('admin', 'dba'), update);
router.delete('/:id', authenticate, authorize('admin'), remove);

module.exports = router;
