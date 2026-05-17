import express from 'express';
import {
  GetBrands,
  CreateBrand,
  EditBrand,
  DeleteBrand
} from '../../Controllers/admin/BrandsController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetBrands);
router.post('/create', CreateBrand);
router.put('/edit/:id', EditBrand);
router.delete('/delete/:id', DeleteBrand);

export default router;