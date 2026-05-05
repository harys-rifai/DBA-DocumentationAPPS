const express = require('express');
const router = express.Router();
const { getAll } = require('../controllers/logController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'dba'), getAll);

module.exports = router;
