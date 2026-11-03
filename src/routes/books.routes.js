import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { listBooks } from "../controllers/books.controller.js";

const router = Router();

// The book list is public, but "My Books" (?mine=true) needs a logged-in user.
const verifyTokenIfMine = (req, res, next) =>
  req.query.mine === "true" ? verifyToken(req, res, next) : next();

router.get("/", verifyTokenIfMine, listBooks);

export default router;
