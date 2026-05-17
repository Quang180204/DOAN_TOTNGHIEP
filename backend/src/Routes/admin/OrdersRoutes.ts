import express from 'express';
import {
  GetOrders,
  GetTrashOrders,
  GetOrderDetail,
  UpdateOrderStatus,
  CancelOrder,
  DeleteOrder
} from '../../Controllers/admin/OrdersController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetOrders);
router.get('/trash', GetTrashOrders);
router.get('/:id', GetOrderDetail);
router.put('/update-status/:id', UpdateOrderStatus);
router.put('/cancel/:id', CancelOrder);
router.delete('/delete/:id', DeleteOrder);


export default router;