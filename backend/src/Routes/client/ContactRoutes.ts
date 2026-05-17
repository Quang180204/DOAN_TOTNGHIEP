import express from 'express';
import { CreateContact, GetMyContacts, ReplyMyContact } from '../../Controllers/client/ContactController';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);
router.get('/my', GetMyContacts);
router.post('/', CreateContact);
router.post('/:id/reply', ReplyMyContact);

export default router;
