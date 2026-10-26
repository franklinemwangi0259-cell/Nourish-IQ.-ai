/**
 * Client-side Gemini proxy service.
 * Delivers secure full-stack AI calls by delegating actual execution to our Express server backend.
 */

export const analyzeFoodImage = async (base64Image: string) => {
  const response = await fetch("/api/gemini/analyze-food-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze food image (status: ${response.status})`);
  }
  return response.json();
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
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get nutrition advice (status: ${response.status})`);
  }
  const data = await response.json();
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
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get complex nutrition advice (status: ${response.status})`);
  }
  const data = await response.json();
  return data.result;
};

export const searchNutritionInfo = async (query: string) => {
  const response = await fetch("/api/gemini/search-nutrition-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to search nutrition info (status: ${response.status})`);
  }
  const data = await response.json();
  return data.result;
};

export const analyzeRecipe = async (ingredients: string) => {
  const response = await fetch("/api/gemini/analyze-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze recipe (status: ${response.status})`);
  }
  return response.json();
};

export const generateRecipeFromIngredients = async (ingredients: string) => {
  const response = await fetch("/api/gemini/generate-recipe-from-ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate recipe (status: ${response.status})`);
  }
  return response.json();
};

export const remixMeal = async (mealName: string, calories: number) => {
  const response = await fetch("/api/gemini/remix-meal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealName, calories }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to remix meal (status: ${response.status})`);
  }
  return response.json();
};

export const generateSpeech = async (text: string) => {
  const response = await fetch("/api/gemini/generate-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate speech (status: ${response.status})`);
  }
  const json = await response.json();
  return json.data;
};

export const generateNotifications = async () => {
  const response = await fetch("/api/gemini/generate-notifications");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate notifications (status: ${response.status})`);
  }
  return response.json();
};
