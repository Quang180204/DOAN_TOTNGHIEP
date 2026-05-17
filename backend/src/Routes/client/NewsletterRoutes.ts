import express from 'express';
import { SubscribeNewsletter } from '../../Controllers/client/NewsletterController';

const router = express.Router();

router.post('/subscribe', SubscribeNewsletter);

export default router;
