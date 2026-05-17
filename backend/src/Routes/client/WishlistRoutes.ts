import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware';
import {
  DeleteWishlistItem,
  GetWishlist,
  GetWishlistCount,
  ToggleWishlist
} from '../../Controllers/client/WishlistController';

const router = express.Router();

router.use(verifyToken);
router.get('/', GetWishlist);
router.get('/count', GetWishlistCount);
router.post('/toggle', ToggleWishlist);
router.delete('/:productId', DeleteWishlistItem);

export default router;
