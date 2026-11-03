# BookNook Server

The REST API behind **BookNook**, a small online library where readers add books, borrow them for 7 days and return them.

- **Live API:** https://booknook-server-hasibop.vercel.app
- **Client app:** https://booknook-hasibop.vercel.app ([client repo](https://github.com/HasibOp/booknook-client))

## Features

- **8 REST routes** for books and borrows, built with Express 5 and the MongoDB Node.js driver.
- **JWT protection:** the client's BetterAuth signs a short-lived JWT, and the server checks it against the client's public keys (`/api/auth/jwks`) with `jose`. No shared secret is needed.
- **Available copies with `$inc`:** borrowing takes one copy (`$inc: -1`) only while copies are left, and returning gives it back (`$inc: +1`), never going above the total.
- **No double borrow:** a unique index on `{ userEmail, bookId }` means a reader can hold only one copy of the same book at a time. A second try gets a clear `409` message.
- **Owner-only changes:** only the person who added a book can edit or delete it. Total copies can't be set below the number currently borrowed.
- **Validation and clean errors:** every input is checked, and every error comes back as JSON `{ "message": "..." }` with the right status code.
- **Newest first:** New Arrivals and All Books use `sort({ createdAt: -1 })` and `limit()` in MongoDB, with indexes to match.

## API routes

| Method | Route | Auth | What it does |
| --- | --- | --- | --- |
| GET | `/books` | Public (`?mine=true` needs a token) | All books, newest first. Supports `category`, `search` (title or author), `limit` and `mine=true` |
| GET | `/books/:id` | Token | One book |
| POST | `/books` | Token | Add a book. `addedBy` comes from the token, and available copies start at the total |
| PATCH | `/books/:id` | Token (owner) | Update a book; available copies are recalculated |
| DELETE | `/books/:id` | Token (owner) | Delete a book and its borrow records |
| POST | `/borrows` | Token | Borrow a book for 7 days (body: `{ "bookId": "..." }`) |
| GET | `/borrows` | Token | The logged-in reader's borrows, newest first |
| DELETE | `/borrows/:id` | Token (borrower) | Return a book; its copy goes back on the shelf |

Send the token as `Authorization: Bearer <jwt>`.

## Data

- **books:** `title`, `author`, `category` (Fiction, Science, History, Kids, Others), `image`, `description`, `totalCopies`, `availableCopies`, `addedBy { name, email }`, `createdAt`, `updatedAt`
- **borrows:** `bookId`, `bookTitle`, `bookImage`, `userEmail`, `userName`, `borrowDate`, `returnDate`

## Tech stack

Node.js · Express 5 · MongoDB (Atlas) · jose (JWT/JWKS) · dotenv · CORS · deployed on Vercel

## Run it locally

```bash
npm install
cp .env.example .env
npm run dev
```

The server starts on http://localhost:5000. To fill an empty database with 15 sample books, run `npm run seed` (add `-- --reset` to replace them).

### Environment variables

| Name | Example | Notes |
| --- | --- | --- |
| `PORT` | `5000` | Local only |
| `MONGODB_URI` | `mongodb+srv://...` | The same database the client uses |
| `DB_NAME` | `booknook` | |
| `CLIENT_URL` | `http://localhost:3000` | The client's URL, with no trailing slash. Used for CORS and JWT checks, and must match the client's `BETTER_AUTH_URL` |

## Deploy on Vercel

`vercel.json` runs `index.js` as a serverless function. Add `MONGODB_URI`, `DB_NAME` and `CLIENT_URL` (the live client URL) in the Vercel project settings, and allow access from anywhere (`0.0.0.0/0`) in MongoDB Atlas Network Access.
