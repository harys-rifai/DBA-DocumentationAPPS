import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate as any, authorize('admin') as any, getAll as any);
router.get('/:id', authenticate as any, getById as any);
router.post('/', authenticate as any, authorize('admin') as any, create as any);
router.put('/:id', authenticate as any, authorize('admin') as any, update as any);
router.delete('/:id', authenticate as any, authorize('admin') as any, remove as any);

export default router;
