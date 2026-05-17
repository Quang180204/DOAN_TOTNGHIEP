import express from 'express';
import {
  GetAddresses,
  GetAddressDetail,
  CreateAddress,
  UpdateAddress,
  SetDefaultAddress,
  DeleteAddress
} from '../../Controllers/client/AddressController';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(verifyToken);

router.get('/', GetAddresses);
router.get('/:id', GetAddressDetail);
router.post('/create', CreateAddress);
router.put('/update/:id', UpdateAddress);
router.put('/set-default/:id', SetDefaultAddress);
router.delete('/delete/:id', DeleteAddress);

export default router;