import express from 'express';
import {
  PreviewCart,
  ViewCart,
  AddToCart,
  UpdateCartQuantity,
  RemoveFromCart,
  UseDiscountCode,
  Checkout,
  SaveOrder,
  CreateMomoPayment,
  ConfirmMomoPayment
} from '../../Controllers/client/CartController';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Public routes (không cần đăng nhập)
router.get('/preview', PreviewCart);
router.get('/view', ViewCart);
router.post('/add', verifyToken, AddToCart);
router.put('/update', verifyToken, UpdateCartQuantity);
router.delete('/remove/:productId', verifyToken, RemoveFromCart);
router.post('/discount', UseDiscountCode);

// Protected routes (cần đăng nhập)
router.get('/checkout', verifyToken, Checkout);
router.post('/save-order', verifyToken, SaveOrder);
router.post('/momo/create', verifyToken, CreateMomoPayment);
router.post('/momo/confirm', verifyToken, ConfirmMomoPayment);

export default router;
