import express from 'express';
import {
  GetGenres,
  CreateGenre,
  EditGenre,
  DeleteGenre
} from '../../Controllers/admin/GenresController';
import { verifyToken } from '../../middleware/authMiddleware';
import { isAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', GetGenres);
router.post('/create', CreateGenre);
router.put('/edit/:id', EditGenre);
router.delete('/delete/:id', DeleteGenre);

export default router;