import express from 'express';
import { DeleteContact, GetContacts, ReplyContact } from '../../Controllers/admin/ContactsController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetContacts);
router.post('/:id/reply', ReplyContact);
router.delete('/:id', DeleteContact);

export default router;
