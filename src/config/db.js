import dns from 'node:dns';
import { MongoClient } from 'mongodb';
import { env } from './env.js';

// On some Windows machines Node's resolver points at 127.0.0.1, which breaks the
// SRV lookup behind mongodb+srv:// URIs (querySrv ECONNREFUSED). This only affects
// dns.resolve*, which the driver uses for SRV/TXT records. Vercel's DNS works fine.
if (!env.isVercel) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

let client;
let connection; // one shared promise per server instance, reused by every request

async function ensureIndexes(db) {
  await Promise.all([
    // newest books first (Home "New Arrivals" and All Books)
    db.collection('books').createIndex({ createdAt: -1 }),
    // "My Books" lookups
    db.collection('books').createIndex({ 'addedBy.email': 1 }),
    // a user can hold only one copy of the same book at a time
    db
      .collection('borrows')
      .createIndex({ userEmail: 1, bookId: 1 }, { unique: true }),
  ]);
}

export function connectDB() {
  if (!env.mongoUri) {
    return Promise.reject(
      new Error('MONGODB_URI is missing. Add it to your .env file.'),
    );
  }

  connection ??= (async () => {
    client = new MongoClient(env.mongoUri);
    await client.connect();
    const db = client.db(env.dbName);
    await ensureIndexes(db);
    console.log(`MongoDB connected (database: ${env.dbName})`);
    return db;
  })().catch((err) => {
    // Forget the failed attempt so the next request can try again.
    connection = undefined;
    throw err;
  });

  return connection;
}

export async function getCollections() {
  const db = await connectDB();
  return {
    books: db.collection('books'),
    borrows: db.collection('borrows'),
  };
}
