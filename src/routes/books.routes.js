import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/books.controller.js';

const router = Router();

const verifyTokenIfMine = (req, res, next) =>
  req.query.mine === 'true' ? verifyToken(req, res, next) : next();

router.get('/', verifyTokenIfMine, listBooks);
router.get('/:id', verifyToken, getBook);
router.post('/', verifyToken, createBook);
router.patch('/:id', verifyToken, updateBook);
router.delete('/:id', verifyToken, deleteBook);

export default router;
