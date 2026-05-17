import express from 'express';
import {
  AdminLogin,        // ← ĐÃ THÊM
  GetAccounts,
  GetTrashAccounts,
  GetAccountDetail,
  ChangeRoles,
  DisableAccount,
  ActivateAccount,
  DeleteAccount
} from '../../Controllers/admin/AuthController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

// ==================== PUBLIC ROUTES (không cần token) ====================
router.post('/login', AdminLogin);  // ← ĐÃ THÊM

// ==================== PROTECTED ROUTES (cần token + admin) ====================
router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetAccounts);
router.get('/trash', GetTrashAccounts);
router.get('/:id', GetAccountDetail);
router.put('/change-role', ChangeRoles);
router.put('/disable/:id', DisableAccount);
router.put('/activate/:id', ActivateAccount);
router.delete('/delete/:id', DeleteAccount);

export default router;