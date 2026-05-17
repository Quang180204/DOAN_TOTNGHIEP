import express from 'express';
import {
  GetDiscounts,
  CreateDiscount,
  EditDiscount,
  DeleteDiscount
} from '../../Controllers/admin/DiscountsController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetDiscounts);
router.post('/create', CreateDiscount);
router.put('/edit/:id', EditDiscount);
router.delete('/delete/:id', DeleteDiscount);

export default router;