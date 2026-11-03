import { getCollections } from '../config/db.js';
import { CATEGORIES, MAX_LIST_LIMIT } from '../config/constants.js';
import { createError } from '../utils/httpError.js';
import { toObjectId } from '../utils/objectId.js';
import { validateBook } from '../utils/validateBook.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /books?limit=6&category=Science&search=orwell&mine=true
export async function listBooks(req, res) {
  const { books } = await getCollections();
  const { category, search, mine, limit } = req.query;
  const filter = {};

  if (category !== undefined && category !== 'All') {
    if (!CATEGORIES.includes(category)) {
      throw createError(
        400,
        `Category must be one of: ${CATEGORIES.join(', ')}`,
      );
    }
    filter.category = category;
  }

  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
    filter.$or = [{ title: pattern }, { author: pattern }];
  }

  // req.user is set by verifyToken, which the route runs whenever mine=true
  if (mine === 'true') {
    filter['addedBy.email'] = req.user.email;
  }

  // newest first; _id breaks ties so the order is stable
  let cursor = books.find(filter).sort({ createdAt: -1, _id: -1 });

  if (limit !== undefined) {
    const count = Number(limit);
    if (!Number.isInteger(count) || count < 1 || count > MAX_LIST_LIMIT) {
      throw createError(
        400,
        `limit must be a whole number from 1 to ${MAX_LIST_LIMIT}`,
      );
    }
    cursor = cursor.limit(count);
  }

  res.json(await cursor.toArray());
}

// GET /books/:id
export async function getBook(req, res) {
  const { books } = await getCollections();
  const book = await books.findOne({
    _id: toObjectId(req.params.id, 'book id'),
  });
  if (!book) throw createError(404, 'Book not found');
  res.json(book);
}

// POST /books
export async function createBook(req, res) {
  const { books } = await getCollections();
  const data = validateBook(req.body);
  const now = new Date();

  const book = {
    ...data,
    availableCopies: data.totalCopies,
    // who added it always comes from the verified token, never from the form
    addedBy: { name: req.user.name || req.user.email, email: req.user.email },
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await books.insertOne(book);
  res.status(201).json({ ...book, _id: insertedId });
}

// Loads a book and makes sure the logged-in user is the one who added it.
async function findOwnBook(books, id, user) {
  const book = await books.findOne({ _id: toObjectId(id, 'book id') });
  if (!book) throw createError(404, 'Book not found');
  if (book.addedBy?.email !== user.email) {
    throw createError(403, 'You can only change books you added');
  }
  return book;
}

// PATCH /books/:id
export async function updateBook(req, res) {
  const { books } = await getCollections();
  const book = await findOwnBook(books, req.params.id, req.user);
  const changes = validateBook(req.body, { partial: true });

  if (changes.totalCopies !== undefined) {
    const borrowed = book.totalCopies - book.availableCopies;
    if (changes.totalCopies < borrowed) {
      throw createError(
        409,
        `${borrowed} ${borrowed === 1 ? 'copy is' : 'copies are'} borrowed right now, so total copies can't be less than ${borrowed}`,
      );
    }
    changes.availableCopies = changes.totalCopies - borrowed;
  }

  // Matching on availableCopies too means a borrow or return that lands between
  // our read and this write can't leave the copy counts out of sync.
  const updated = await books.findOneAndUpdate(
    { _id: book._id, availableCopies: book.availableCopies },
    { $set: { ...changes, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!updated)
    throw createError(
      409,
      'This book was just borrowed or returned. Please try again.',
    );

  res.json(updated);
}

// DELETE /books/:id
export async function deleteBook(req, res) {
  const { books, borrows } = await getCollections();
  const book = await findOwnBook(books, req.params.id, req.user);

  await books.deleteOne({ _id: book._id });
  // nobody can return a book that no longer exists, so clear its borrows too
  await borrows.deleteMany({ bookId: book._id });

  res.json({ message: 'Book deleted', deletedId: book._id });
}
