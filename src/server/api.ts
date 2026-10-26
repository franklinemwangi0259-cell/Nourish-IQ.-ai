import { Router } from "express";
import * as geminiBackend from "../lib/gemini.backend";
import * as webauthnBackend from "../lib/webauthn.backend";

export const apiRouter = Router();

// Health endpoints
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

apiRouter.get("/health/integrations", (req, res) => {
  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY
  );
  res.json({
    status: "ok",
    timestamp: Date.now(),
    geminiConfigured: hasGeminiKey,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

apiRouter.get("/health/test-gemini", async (req, res) => {
  try {
    const model = (req.query.model as string) || "gemini-3.8-flash";
    const result = await geminiBackend.testModelLatency(model);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to test Gemini" });
  }
});

// WebAuthn Biometric / Passkey Routes
apiRouter.get("/webauthn/register/options", async (req, res) => {
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

apiRouter.post("/webauthn/register/verify", async (req, res) => {
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

apiRouter.post("/webauthn/login/options", async (req, res) => {
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

apiRouter.post("/webauthn/login/verify", async (req, res) => {
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

// Gemini API Proxy Routes
apiRouter.post("/gemini/analyze-food-image", async (req, res) => {
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

apiRouter.post("/gemini/nutrition-advice", async (req, res) => {
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

apiRouter.post("/gemini/complex-nutrition-advice", async (req, res) => {
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

apiRouter.post("/gemini/search-nutrition-info", async (req, res) => {
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

apiRouter.post("/gemini/analyze-recipe", async (req, res) => {
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

apiRouter.post("/gemini/generate-recipe-from-ingredients", async (req, res) => {
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

apiRouter.post("/gemini/remix-meal", async (req, res) => {
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

apiRouter.post("/gemini/generate-speech", async (req, res) => {
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

apiRouter.get("/gemini/generate-notifications", async (req, res) => {
  try {
    const data = await geminiBackend.generateNotifications();
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/gemini/generate-notifications:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});
