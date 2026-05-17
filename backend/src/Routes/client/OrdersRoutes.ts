import express from 'express';
import { GetMyOrders, GetMyOrderDetail, TrackOrder } from '../../Controllers/client/OrdersController';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Public route (theo dõi đơn hàng không cần đăng nhập)
router.get('/tracking/:id', TrackOrder);

// Protected routes (cần đăng nhập)
router.get('/', verifyToken, GetMyOrders);
router.get('/:id', verifyToken, GetMyOrderDetail);

export default router;