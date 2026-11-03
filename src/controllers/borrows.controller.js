import { getCollections } from "../config/db.js";
import { BORROW_DAYS } from "../config/constants.js";
import { createError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const alreadyBorrowedError = () => createError(409, "You have already borrowed this book");

export async function createBorrow(req, res) {
  const { books, borrows } = await getCollections();
  const bookId = toObjectId(req.body?.bookId, "book id");
  const { email, name } = req.user;

  if (await borrows.findOne({ bookId, userEmail: email })) {
    throw alreadyBorrowedError();
  }

  const book = await books.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { returnDocument: "after" },
  );

  if (!book) {
    const exists = await books.countDocuments({ _id: bookId }, { limit: 1 });
    throw exists
      ? createError(409, "No copies are available right now")
      : createError(404, "Book not found");
  }

  const borrowDate = new Date();
  const borrow = {
    bookId,
    bookTitle: book.title,
    bookImage: book.image,
    userEmail: email,
    userName: name || email,
    borrowDate,
    returnDate: new Date(borrowDate.getTime() + BORROW_DAYS * DAY_MS),
  };

  try {
    const { insertedId } = await borrows.insertOne(borrow);
    res.status(201).json({ ...borrow, _id: insertedId });
  } catch (err) {
    await books.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } });
    throw err.code === 11000 ? alreadyBorrowedError() : err;
  }
}
