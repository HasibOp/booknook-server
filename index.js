import express from "express";
import cors from "cors";
import { env } from "./src/config/env.js";

const app = express();

const allowedOrigins = [...new Set([env.clientUrl, "http://localhost:3000"])];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "BookNook server is running" });
});

// Vercel runs the exported app as a serverless function, so only listen locally.
if (!env.isVercel) {
  app.listen(env.port, () => {
    console.log(`BookNook server listening on http://localhost:${env.port}`);
  });
}

export default app;
