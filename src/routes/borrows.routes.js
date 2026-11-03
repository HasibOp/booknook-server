import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  createBorrow,
  listMyBorrows,
  returnBorrow,
} from '../controllers/borrows.controller.js';

const router = Router();

router.use(verifyToken);

router.post('/', createBorrow);
router.get('/', listMyBorrows);
router.delete('/:id', returnBorrow);

export default router;
