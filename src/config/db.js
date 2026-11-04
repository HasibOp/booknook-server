import dns from 'node:dns';
import { MongoClient } from 'mongodb';
import { env } from './env.js';

// Some Windows setups can't resolve mongodb+srv:// SRV records without this.
if (!env.isVercel) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

let client;
let connection;

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('books').createIndex({ createdAt: -1 }),
    db.collection('books').createIndex({ 'addedBy.email': 1 }),
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
