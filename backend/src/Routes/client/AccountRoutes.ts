import express from 'express';
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  GetProfile,
  UpdateProfile,
  ChangePassword,
  UpdateAvatar
} from '../../Controllers/client/AccountController';
import { verifyToken } from '../../middleware/authMiddleware';
import { uploadAvatar, handleUploadError } from '../../middleware/uploadMiddleware';

const router = express.Router();

// Public routes
router.post('/login', Login);
router.post('/register', Register);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password', ResetPassword);

// Protected routes
router.get('/profile', verifyToken, GetProfile);
router.put('/profile', verifyToken, UpdateProfile);
router.put('/profile/update', verifyToken, UpdateProfile);
router.put('/change-password', verifyToken, ChangePassword);
router.post('/upload-avatar', verifyToken, uploadAvatar, handleUploadError, UpdateAvatar);

export default router;
