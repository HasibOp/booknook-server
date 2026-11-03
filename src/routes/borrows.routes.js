import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createBorrow } from "../controllers/borrows.controller.js";

const router = Router();

router.use(verifyToken);

router.post("/", createBorrow);

export default router;
