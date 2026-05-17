import express from 'express';
import {
  Laptop,
  Accessories,
  ProductDetail,
  SearchResult,
  ProductComment,
  ReplyComment,
  GetProductFeedbacks
} from '../../Controllers/client/ProductsController';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/laptop', Laptop);
router.get('/accessories', Accessories);
router.get('/search', SearchResult);
router.get('/:id', ProductDetail);
router.get('/:id/feedbacks', GetProductFeedbacks);

// Protected routes (cần đăng nhập)
router.post('/comment', verifyToken, ProductComment);
router.post('/reply', verifyToken, ReplyComment);

export default router;