import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes a food image using gemini-3.1-pro-preview for high accuracy.
 */
export const analyzeFoodImage = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: "Analyze this food image and provide nutritional information. Return a JSON object with: name, calories, protein (g), carbs (g), fat (g), vitamins (list of main vitamins/minerals), isHealthy (boolean), healthReason (short explanation), mood (expected mood impact), and energy (1-5 scale). Be as accurate as possible based on visual estimation.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          vitamins: { type: Type.ARRAY, items: { type: Type.STRING } },
          isHealthy: { type: Type.BOOLEAN },
          healthReason: { type: Type.STRING },
          mood: { type: Type.STRING, description: "A short string describing the expected mood impact of this food (e.g., 'Energetic', 'Sluggish', 'Balanced')" },
          energy: { type: Type.NUMBER, description: "A number from 1 to 5 representing the expected energy level after eating this food (1 = very low, 5 = very high)" },
        },
        required: ["name", "calories", "protein", "carbs", "fat", "vitamins", "isHealthy", "healthReason"],
      },
    },
  });

  return JSON.parse(response.text);
};

/**
 * General nutrition and habit advice using gemini-3.1-flash-lite-preview for low latency.
 */
export const getNutritionAdvice = async (history: any[], habits: any[], query: string, userName?: string, personality: string = 'empathetic') => {
  const personalityPrompts: Record<string, string> = {
    empathetic: "You are warm, supportive, and deeply empathetic. You focus on the user's feelings and provide gentle encouragement. Use phrases like 'I understand how you feel' or 'It's okay to have off days'.",
    strict: "You are a disciplined, no-nonsense fitness coach. You focus on results, consistency, and accountability. Be direct, firm, and push the user to exceed their limits. Use phrases like 'No excuses' or 'Results require effort'.",
    scientific: "You are a data-driven clinical nutritionist. You focus on biochemical facts, peer-reviewed research, and precise metrics. Use technical terms and explain the 'why' behind every recommendation with science.",
    playful: "You are a fun, energetic, and slightly quirky health buddy. You use humor, emojis, and lighthearted analogies to keep things exciting. Make health feel like a game!"
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `User query: ${query}\n\nHistorical food logs (most recent first):\n${JSON.stringify(history, null, 2)}\n\nUser habits and streaks:\n${JSON.stringify(habits, null, 2)}` }],
      },
    ],
    config: {
      systemInstruction: `You are NORI AI, an advanced nutritional and habit intelligence system. ${personalityPrompts[personality] || personalityPrompts.empathetic} Your goal is to provide highly personalized advice and motivational support based on the user's data. ${userName ? `The user's name is ${userName}. Address them by name occasionally.` : ""} 

Analyze both the food history and habit tracking data. 
- If you see a habit streak, congratulate the user in your specific style.
- If a habit is lagging, provide motivation consistent with your personality.
- Use habit formation techniques (Habit Stacking, Implementation Intentions, Environment Design) but frame them within your chosen conversational style.
- Connect nutritional advice with habit formation.
- Always prioritize health and sustainable habits.`,
    },
  });

  return response.text;
};

/**
 * Complex nutrition and habit analysis using gemini-3.1-pro-preview with HIGH thinking level.
 */
export const getComplexNutritionAdvice = async (history: any[], habits: any[], query: string, userName?: string, personality: string = 'empathetic') => {
  const personalityPrompts: Record<string, string> = {
    empathetic: "You are a compassionate wellness mentor. Your analysis is deep, thoughtful, and focuses on holistic well-being and self-care.",
    strict: "You are a high-performance strategist. Your analysis is rigorous, focusing on optimization, discipline, and peak physical output.",
    scientific: "You are a research scientist. Your analysis is exhaustive, citing metabolic pathways and nutritional science in detail.",
    playful: "You are a creative health enthusiast. Your analysis is engaging, using vivid metaphors and gamified insights."
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `Complex query: ${query}\n\nHistorical food logs (most recent first):\n${JSON.stringify(history, null, 2)}\n\nUser habits and streaks:\n${JSON.stringify(habits, null, 2)}` }],
      },
    ],
    config: {
      systemInstruction: `You are NORI AI in Deep Thinking mode. ${personalityPrompts[personality] || personalityPrompts.empathetic} ${userName ? `The user's name is ${userName}. Address them by name.` : ""} Provide an exhaustive, deeply reasoned nutritional and behavioral analysis. 

Break down your reasoning step-by-step. 
- Thoroughly examine the user's food history for long-term trends and nutritional deficiencies.
- Analyze habit adherence patterns. Identify correlations between meal logging and habit completion.
- Provide sophisticated psychological insights into habit formation.
- Your analysis should be comprehensive, scientifically rigorous, and deeply motivational in your specific style.`,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    },
  });

  return response.text;
};

/**
 * Search-grounded nutrition info using gemini-3-flash-preview.
 */
export const searchNutritionInfo = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return response.text;
};

/**
 * Analyzes a recipe using gemini-3-flash-preview.
 */
export const analyzeRecipe = async (ingredients: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `Analyze the nutritional content of this recipe/ingredients list: ${ingredients}. Return a JSON object with: name (a descriptive title), calories, protein (g), carbs (g), fat (g), vitamins (list of main vitamins/minerals), isHealthy (boolean), healthReason (short explanation), mood (expected mood impact), and energy (1-5 scale).` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          vitamins: { type: Type.ARRAY, items: { type: Type.STRING } },
          isHealthy: { type: Type.BOOLEAN },
          healthReason: { type: Type.STRING },
          mood: { type: Type.STRING, description: "A short string describing the expected mood impact of this food (e.g., 'Energetic', 'Sluggish', 'Balanced')" },
          energy: { type: Type.NUMBER, description: "A number from 1 to 5 representing the expected energy level after eating this food (1 = very low, 5 = very high)" },
        },
        required: ["name", "calories", "protein", "carbs", "fat", "vitamins", "isHealthy", "healthReason"],
      },
    },
  });

  return JSON.parse(response.text);
};

/**
 * Generates a recipe from a list of ingredients using gemini-3.1-flash-lite-preview.
 */
export const generateRecipeFromIngredients = async (ingredients: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `I have these ingredients: ${ingredients}. Generate a creative, healthy recipe I can make. Return a JSON object with: title, description, ingredients (array of strings), instructions (array of strings), and estimatedTime (string).` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedTime: { type: Type.STRING },
        },
        required: ["title", "description", "ingredients", "instructions", "estimatedTime"],
      },
    },
  });

  return JSON.parse(response.text);
};

/**
 * Suggests a healthier "remix" of a meal using gemini-3.1-pro-preview.
 */
export const remixMeal = async (mealName: string, calories: number) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `I just ate ${mealName} (${calories} calories). Suggest a healthier "remix" of this meal that is lower in calories or higher in nutrients, but keeps the same spirit. Return a JSON object with: remixedName, description, calorieSaving (number), and keyImprovement (string).` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          remixedName: { type: Type.STRING },
          description: { type: Type.STRING },
          calorieSaving: { type: Type.NUMBER },
          keyImprovement: { type: Type.STRING },
        },
        required: ["remixedName", "description", "calorieSaving", "keyImprovement"],
      },
    },
  });

  return JSON.parse(response.text);
};

/**
 * Converts text to speech using gemini-2.5-flash-preview-tts.
 */
export const generateSpeech = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

/**
 * Generates 3 fresh nutrition tips/trends for the notification banner.
 */
export const generateNotifications = async () => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: "Generate 3 short, engaging nutrition tips or superfood alerts for a notification banner. Each tip should have a 'title' and a 'description' (max 100 chars). Return as a JSON array of objects." }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "description"],
        },
      },
    },
  });

  return JSON.parse(response.text);
};
