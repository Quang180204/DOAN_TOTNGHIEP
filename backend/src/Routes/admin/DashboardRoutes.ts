import express from 'express';
import { GetDashboardStats } from '../../Controllers/admin/DashboardController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetDashboardStats);

export default router;