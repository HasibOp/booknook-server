import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Strip trailing slashes so the URL matches the JWT issuer exactly.
const trimSlash = (url) => url.replace(/\/+$/, "");

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME || "booknook",
  clientUrl: trimSlash(process.env.CLIENT_URL || "http://localhost:3000"),
  isVercel: Boolean(process.env.VERCEL),
  isProduction: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
};
