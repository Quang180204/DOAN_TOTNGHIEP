import { Router } from 'express';
import { SendChatbotMessage } from '../../Controllers/client/ChatbotController';

const router = Router();

router.post('/message', SendChatbotMessage);

export default router;
