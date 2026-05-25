import express from 'express';
import {
  GetFeedbacks,
  ReplyComment,
  DeleteFeedback
} from '../../Controllers/admin/FeedbacksController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetFeedbacks);
router.post('/reply', ReplyComment);
router.delete('/delete/:id', DeleteFeedback);

export default router;
