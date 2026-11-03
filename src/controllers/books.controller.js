import { getCollections } from "../config/db.js";
import { CATEGORIES, MAX_LIST_LIMIT } from "../config/constants.js";
import { createError } from "../utils/httpError.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /books?limit=6&category=Science&search=orwell&mine=true
export async function listBooks(req, res) {
  const { books } = await getCollections();
  const { category, search, mine, limit } = req.query;
  const filter = {};

  if (category !== undefined && category !== "All") {
    if (!CATEGORIES.includes(category)) {
      throw createError(400, `Category must be one of: ${CATEGORIES.join(", ")}`);
    }
    filter.category = category;
  }

  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim().slice(0, 100)), "i");
    filter.$or = [{ title: pattern }, { author: pattern }];
  }

  // req.user is set by verifyToken, which the route runs whenever mine=true
  if (mine === "true") {
    filter["addedBy.email"] = req.user.email;
  }

  // newest first; _id breaks ties so the order is stable
  let cursor = books.find(filter).sort({ createdAt: -1, _id: -1 });

  if (limit !== undefined) {
    const count = Number(limit);
    if (!Number.isInteger(count) || count < 1 || count > MAX_LIST_LIMIT) {
      throw createError(400, `limit must be a whole number from 1 to ${MAX_LIST_LIMIT}`);
    }
    cursor = cursor.limit(count);
  }

  res.json(await cursor.toArray());
}
