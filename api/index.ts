import express from "express";
import { apiRouter } from "../src/server/api";

const app = express();

// Enable CORS for Vercel Serverless Function
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Configure larger payload limits for image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Support requests routed with or without /api prefix
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Vercel Serverless API error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
});

export default app;
