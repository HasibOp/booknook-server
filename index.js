import express from "express";
import cors from "cors";
import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/errorHandler.js";

const app = express();

const allowedOrigins = [...new Set([env.clientUrl, "http://localhost:3000"])];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "BookNook server is running" });
});

// Every API route below needs the database. The connection is made once and
// reused, which also covers serverless cold starts on Vercel.
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Unknown routes and all errors answer with JSON { message }. Keep these last.
app.use(notFound);
app.use(errorHandler);

// Vercel runs the exported app as a serverless function, so only listen locally.
if (!env.isVercel) {
  app.listen(env.port, () => {
    console.log(`BookNook server listening on http://localhost:${env.port}`);
    connectDB().catch((err) => console.error("MongoDB connection failed:", err.message));
  });
}

export default app;
