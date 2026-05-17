import express from 'express';
import {
  GetProducts,
  GetTrashProducts,
  GetProductDetail,
  CreateProduct,
  EditProduct,
  DisableProduct,
  UndoProduct,
  DeleteProduct
} from '../../Controllers/admin/ProductsController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetProducts);
router.get('/trash', GetTrashProducts);
router.get('/:id', GetProductDetail);
router.post('/create', CreateProduct);
router.put('/edit/:id', EditProduct);
router.put('/disable/:id', DisableProduct);
router.put('/undo/:id', UndoProduct);
router.delete('/delete/:id', DeleteProduct);

export default router;