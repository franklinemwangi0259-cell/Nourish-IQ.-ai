/**
 * Client-side Gemini proxy service.
 * Delivers secure full-stack AI calls by delegating actual execution to our Express/Vercel serverless backend.
 */

async function handleApiResponse(response: Response, defaultActionName: string) {
  const contentType = response.headers.get("content-type") || "";

  // Guard against HTML error pages or SPA rewrites when backend is unreachable
  if (!contentType.includes("application/json")) {
    const rawText = await response.text().catch(() => "");
    if (rawText.includes("<!DOCTYPE") || rawText.includes("<html") || response.status === 404) {
      throw new Error(
        `AI service endpoint is unreachable (status: ${response.status}). If deployed on Vercel, ensure GEMINI_API_KEY is configured in your Vercel Project Settings > Environment Variables.`
      );
    }
    throw new Error(`Failed to ${defaultActionName} (status: ${response.status})`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Failed to ${defaultActionName} (status: ${response.status})`);
  }

  return data;
}

export const analyzeFoodImage = async (base64Image: string) => {
  const response = await fetch("/api/gemini/analyze-food-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image }),
  });
  return handleApiResponse(response, "analyze food image");
};

export const getNutritionAdvice = async (
  history: any[],
  habits: any[],
  query: string,
  userName?: string,
  personality?: string
) => {
  const response = await fetch("/api/gemini/nutrition-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, habits, query, userName, personality }),
  });
  const data = await handleApiResponse(response, "get nutrition advice");
  return data.result;
};

export const getComplexNutritionAdvice = async (
  history: any[],
  habits: any[],
  query: string,
  userName?: string,
  personality?: string
) => {
  const response = await fetch("/api/gemini/complex-nutrition-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history, habits, query, userName, personality }),
  });
  const data = await handleApiResponse(response, "get complex nutrition advice");
  return data.result;
};

export const searchNutritionInfo = async (query: string) => {
  const response = await fetch("/api/gemini/search-nutrition-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const data = await handleApiResponse(response, "search nutrition info");
  return data.result;
};

export const analyzeRecipe = async (ingredients: string) => {
  const response = await fetch("/api/gemini/analyze-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  return handleApiResponse(response, "analyze recipe");
};

export const generateRecipeFromIngredients = async (ingredients: string) => {
  const response = await fetch("/api/gemini/generate-recipe-from-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  return handleApiResponse(response, "generate recipe");
};

export const remixMeal = async (mealName: string, calories: number) => {
  const response = await fetch("/api/gemini/remix-meal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealName, calories }),
  });
  return handleApiResponse(response, "remix meal");
};

export const generateSpeech = async (text: string) => {
  const response = await fetch("/api/gemini/generate-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const json = await handleApiResponse(response, "generate speech");
  return json.data;
};

export const generateNotifications = async () => {
  const response = await fetch("/api/gemini/generate-notifications");
  return handleApiResponse(response, "generate notifications");
};
