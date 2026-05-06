import { Router } from 'express';
import { getAll, getById, create, update, remove, getDbTypes } from '../controllers/dokumentasiController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getAll as any);
router.get('/db-types', getDbTypes as any);
router.get('/:id', getById as any);
router.post('/', authenticate as any, authorize('admin', 'dba') as any, create as any);
router.put('/:id', authenticate as any, authorize('admin', 'dba') as any, update as any);
router.delete('/:id', authenticate as any, authorize('admin') as any, remove as any);

export default router;
