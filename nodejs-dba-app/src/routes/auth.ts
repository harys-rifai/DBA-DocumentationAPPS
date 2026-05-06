import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login as any);
router.post('/logout', authenticate as any, logout as any);
router.get('/me', authenticate as any, me as any);

export default router;
