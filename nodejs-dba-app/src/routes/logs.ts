import { Router } from 'express';
import { getAll, getById } from '../controllers/logController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate as any, authorize('admin', 'dba') as any, getAll as any);
router.get('/:id', authenticate as any, authorize('admin', 'dba') as any, getById as any);

export default router;
