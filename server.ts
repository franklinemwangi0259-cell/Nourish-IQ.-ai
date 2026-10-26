import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import * as geminiBackend from "./src/lib/gemini.backend.ts";
import * as webauthnBackend from "./src/lib/webauthn.backend.ts";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Enable CORS for cross-device LAN access and preview proxies
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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WebAuthn Biometric / Passkey Routes
  app.get("/api/webauthn/register/options", async (req, res) => {
    try {
      const { uid, email, displayName, rpID } = req.query;
      if (!uid || !email) {
        return res.status(400).json({ error: "Missing uid or email" });
      }
      const hostname = (rpID as string) || "localhost";
      const options = await webauthnBackend.getRegisterOptions(
        uid as string,
        email as string,
        (displayName as string) || "",
        hostname
      );
      res.json(options);
    } catch (error: any) {
      console.error("Error generating registration options:", error);
      res.status(500).json({ error: error.message || "Failed to generate registration options" });
    }
  });

  app.post("/api/webauthn/register/verify", async (req, res) => {
    try {
      const { uid, email, response, rpID, origin } = req.body;
      if (!uid || !email || !response) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const hostname = rpID || "localhost";
      const actualOrigin = origin || `http://${hostname}`;
      const result = await webauthnBackend.verifyRegister(
        uid,
        email,
        response,
        hostname,
        actualOrigin
      );
      res.json(result);
    } catch (error: any) {
      console.error("Error verifying registration:", error);
      res.status(500).json({ error: error.message || "Failed to verify registration" });
    }
  });

  app.post("/api/webauthn/login/options", async (req, res) => {
    try {
      const { email, rpID } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }
      const hostname = rpID || "localhost";
      const options = await webauthnBackend.getLoginOptions(email, hostname);
      res.json(options);
    } catch (error: any) {
      console.error("Error generating login options:", error);
      res.status(500).json({ error: error.message || "Failed to generate login options" });
    }
  });

  app.post("/api/webauthn/login/verify", async (req, res) => {
    try {
      const { email, response, rpID, origin } = req.body;
      if (!email || !response) {
        return res.status(400).json({ error: "Missing email or response" });
      }
      const hostname = rpID || "localhost";
      const actualOrigin = origin || `http://${hostname}`;
      const result = await webauthnBackend.verifyLogin(email, response, hostname, actualOrigin);
      res.json(result);
    } catch (error: any) {
      console.error("Error verifying login:", error);
      res.status(500).json({ error: error.message || "Failed to verify biometric sign-in" });
    }
  });

  app.get("/api/health/integrations", (req, res) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  app.get("/api/health/test-gemini", async (req, res) => {
    try {
      const model = (req.query.model as string) || "gemini-3.6-flash";
      const result = await geminiBackend.testModelLatency(model);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to test Gemini" });
    }
  });

  // Gemini API Proxy Routes
  app.post("/api/gemini/analyze-food-image", async (req, res) => {
    try {
      const { base64Image } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "Missing base64Image parameter" });
      }
      const data = await geminiBackend.analyzeFoodImage(base64Image);
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-food-image:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/nutrition-advice", async (req, res) => {
    try {
      const { history, habits, query, userName, personality } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing query parameter" });
      }
      const data = await geminiBackend.getNutritionAdvice(
        history || [],
        habits || [],
        query,
        userName,
        personality
      );
      res.json({ result: data });
    } catch (error: any) {
      console.error("Error in /api/gemini/nutrition-advice:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/complex-nutrition-advice", async (req, res) => {
    try {
      const { history, habits, query, userName, personality } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing query parameter" });
      }
      const data = await geminiBackend.getComplexNutritionAdvice(
        history || [],
        habits || [],
        query,
        userName,
        personality
      );
      res.json({ result: data });
    } catch (error: any) {
      console.error("Error in /api/gemini/complex-nutrition-advice:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/search-nutrition-info", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing query parameter" });
      }
      const data = await geminiBackend.searchNutritionInfo(query);
      res.json({ result: data });
    } catch (error: any) {
      console.error("Error in /api/gemini/search-nutrition-info:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/analyze-recipe", async (req, res) => {
    try {
      const { ingredients } = req.body;
      if (!ingredients) {
        return res.status(400).json({ error: "Missing ingredients parameter" });
      }
      const data = await geminiBackend.analyzeRecipe(ingredients);
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-recipe:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generate-recipe-from-ingredients", async (req, res) => {
    try {
      const { ingredients } = req.body;
      if (!ingredients) {
        return res.status(400).json({ error: "Missing ingredients parameter" });
      }
      const data = await geminiBackend.generateRecipeFromIngredients(ingredients);
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/generate-recipe-from-ingredients:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/remix-meal", async (req, res) => {
    try {
      const { mealName, calories } = req.body;
      if (!mealName || calories === undefined) {
        return res.status(400).json({ error: "Missing mealName or calories parameter" });
      }
      const data = await geminiBackend.remixMeal(mealName, calories);
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/remix-meal:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/gemini/generate-speech", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text parameter" });
      }
      const data = await geminiBackend.generateSpeech(text);
      res.json({ data });
    } catch (error: any) {
      console.error("Error in /api/gemini/generate-speech:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/gemini/generate-notifications", async (req, res) => {
    try {
      const data = await geminiBackend.generateNotifications();
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/generate-notifications:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Health endpoints for Cloud Run / load balancer probes
  app.get("/_health", (req, res) => res.status(200).send("OK"));
  app.get("/healthz", (req, res) => res.status(200).send("OK"));

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get("*", (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!DOCTYPE html><html><head><title>Nourish IQ</title></head><body><h2>Nourish IQ</h2><p>Application is initializing. Please refresh in a moment.</p></body></html>");
      }
    });
  }

  // Global express error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled express route error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err?.message || "Unknown error" });
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer();
