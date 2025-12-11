
import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BrandIdentity, GeneratedImage, FormData } from "../types";

type RetryOptions = { attempts?: number; baseDelay?: number; allowResourceExhausted?: boolean };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isQuotaZero = (err: any) => {
  const message: string = err?.message ?? err?.error?.message ?? "";
  return message.includes("limit: 0") || message.toLowerCase().includes("quota exceeded");
};

const isRetryableError = (err: any, allowResourceExhausted = true) => {
  const code = err?.code ?? err?.status ?? err?.error?.code;
  const status = err?.error?.status ?? err?.status;
  const message: string = err?.message ?? err?.error?.message ?? "";

  // If quota is zero or not allowed to retry resource exhaustion, bail out fast
  if (!allowResourceExhausted && (code === 429 || status === "RESOURCE_EXHAUSTED")) return false;
  if (isQuotaZero(err)) return false;

  return (
    code === 503 ||
    status === "UNAVAILABLE" ||
    message.includes("overloaded") ||
    code === 429 ||
    status === "RESOURCE_EXHAUSTED"
  );
};

const withRetry = async <T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelay = 800, allowResourceExhausted = true }: RetryOptions = {}
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (!isRetryableError(err, allowResourceExhausted) || i === attempts - 1) {
        throw err;
      }
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 200;
      await sleep(delay);
    }
  }
  throw lastError;
};

const getClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_API_KEY. Please set it in your environment.");
  }

  return new GoogleGenAI({ apiKey });
};

class ImageQuotaError extends Error {
  code = "IMAGE_QUOTA_EXCEEDED";
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

let imageQuotaBlocked = false;

export const validateLocation = async (locationInput: string): Promise<{ isValid: boolean; normalizedName: string }> => {
  const ai = getClient();
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Validate if the following location is a real, recognized place (city, state, or country). 
    Input: "${locationInput}". 
    If it is real, return the formal English name (e.g., "nyc" -> "New York, NY, USA"). 
    If it is fictional or nonsense (e.g., "SnowTown", "Narnia", "Gothamburg"), mark as invalid.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            normalizedName: { type: Type.STRING }
          },
          required: ["isValid", "normalizedName"]
        }
      }
    })
  );

  if (!response.text) return { isValid: false, normalizedName: locationInput };
  return JSON.parse(response.text);
};

export const generateBrandIdentity = async (form: FormData): Promise<BrandIdentity> => {
  const ai = getClient();
  
  const basePrompt = `
    Act as a brutally honest Senior Business Consultant and Financial Analyst.
    
    The user wants to launch a business in: ${form.location}.
    The business concept is: "${form.description}".
    Total available capital: ${form.budget} ${form.currency}.

    User provided constraints:
    ${form.existingName ? `- Use the Company Name: "${form.existingName}"` : "- Generate a professional Company Name."}
    ${form.existingSlogan ? `- Use the Slogan: "${form.existingSlogan}"` : "- Generate a memorable Slogan."}
    ${form.existingColors ? `- Incorporate these colors: ${form.existingColors}` : "- Generate a color palette suitable for the industry."}

    Task 1: Brand Identity
    Refine the concept, generate missing names/slogans.
    IMPORTANT: For 'logoStyle', provide a visual description that can be used to generate a logo.

    Task 2: REALISTIC Location-Aware Budgeting & Projections
    Create a detailed budget. You MUST analyze real-world costs in ${form.location}.
    
    Search Query Generation:
    For each budget item, provide a 'searchQuery' that a user could paste into Google to find real listings.
    Example: Item "Retail Space Rent", Search Query: "commercial retail space for rent in [Location] under [Cost]".

    Financial Projections:
    - Estimate 'estimatedMonthlyRevenue' based on market size in ${form.location} for this niche.
    - Calculate 'breakEvenMonths': How many months until the cumulative profit covers the 'totalOneTimeStartup' costs?
    
    CRITICAL FEASIBILITY CHECK:
    Is ${form.budget} ${form.currency} actually enough to start this specific business in ${form.location}?
    
    Task 3: Core Offerings (Products or Services)
    Analyze the business concept ('${form.description}').
    
    Determine 'businessType': 'Service' or 'Product'.

    IF it is a SERVICE-BASED business (e.g., Gym, Tutoring, Subscription, Consulting, Salon, Cleaning):
    - Generate 3 'Service Packages' or 'Membership Tiers'.
    - 'visualPrompt': Describe a visual representation of the service level (e.g. "A gold tier membership card", "A futuristic hologram representing advanced access", "A glowing shield for security service").
    
    IF it is a PRODUCT-BASED business (e.g., Bakery, Clothing Brand, Tech Store):
    - Generate 3 distinct physical products.
    - 'visualPrompt': Describe the product shot.
    
    Common Rules:
    - Assign a realistic 'price' for ${form.location}.
    - The 'visualPrompt' MUST instruct to place the company logo naturally in the scene (e.g., on a wall, on a card, on the packaging).
  `;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: basePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            slogan: { type: Type.STRING },
            description: { type: Type.STRING, description: "Executive summary" },
            locationValid: { type: Type.BOOLEAN },
            normalizedLocation: { type: Type.STRING },
            businessType: { type: Type.STRING, enum: ["Service", "Product"] },
            colorPalette: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            logoStyle: { type: Type.STRING },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  visualPrompt: { type: Type.STRING }
                },
                required: ["name", "description", "price", "visualPrompt"]
              }
            },
            budgetPlan: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      item: { type: Type.STRING },
                      cost: { type: Type.NUMBER },
                      frequency: { type: Type.STRING, enum: ["One-time", "Monthly", "Yearly"] },
                      reasoning: { type: Type.STRING },
                      searchQuery: { type: Type.STRING }
                    },
                    required: ["category", "item", "cost", "frequency", "reasoning", "searchQuery"]
                  }
                },
                totalEstimatedMonthly: { type: Type.NUMBER },
                totalOneTimeStartup: { type: Type.NUMBER },
                estimatedMonthlyRevenue: { type: Type.NUMBER },
                breakEvenMonths: { type: Type.NUMBER },
                advice: { type: Type.STRING },
                currency: { type: Type.STRING },
                isFeasible: { type: Type.BOOLEAN },
                suggestedMinimumBudget: { type: Type.NUMBER },
                missingBudget: { type: Type.NUMBER }
              },
              required: ["items", "totalEstimatedMonthly", "totalOneTimeStartup", "estimatedMonthlyRevenue", "breakEvenMonths", "advice", "currency", "isFeasible", "suggestedMinimumBudget", "missingBudget"]
            }
          },
          required: ["companyName", "slogan", "description", "colorPalette", "products", "logoStyle", "budgetPlan", "locationValid", "normalizedLocation", "businessType"]
        }
      }
    })
  );

  if (!response.text) throw new Error("No text returned from Gemini");
  
  const data = JSON.parse(response.text) as BrandIdentity;

  // Sanity Check: Math correction for feasibility
  // LLMs can sometimes get the boolean wrong even if the numbers are right
  const userBudget = form.budget;
  const minBudget = data.budgetPlan.suggestedMinimumBudget;

  if (userBudget >= minBudget) {
      data.budgetPlan.isFeasible = true;
      data.budgetPlan.missingBudget = 0;
  } else {
      data.budgetPlan.isFeasible = false;
      // Ensure missing budget is positive
      data.budgetPlan.missingBudget = Math.max(0, minBudget - userBudget);
  }

 return data;
};

/**
 * Generates an image using gemini-2.5-flash-image.
 */
export const generateImage = async (prompt: string, aspectRatio: string = "1:1", referenceImageBase64?: string): Promise<GeneratedImage> => {
  if (imageQuotaBlocked) {
    throw new ImageQuotaError("Image generation quota already exceeded for this API key.");
  }

  const ai = getClient();
  
  const parts: any[] = [];

  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: 'image/png', 
      },
    });
    // We give the prompt full control over how to use the reference image
    parts.push({
      text: `${prompt}. Use the provided image as the strict reference for the logo/brand symbol.`,
    });
  } else {
    parts.push({
      text: prompt,
    });
  }

  // Explicitly add aspect ratio instruction to the text, as flash-image sometimes ignores config
  parts.push({ text: `Ensure the output image has a ${aspectRatio} aspect ratio.`});

  try {
    const response = await withRetry(
      () =>
        ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: parts,
          },
          config: {
              responseModalities: [Modality.IMAGE],
              // Add safety settings to avoid strict blocking on free tier
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              ]
          },
        }),
      { allowResourceExhausted: false }
    );

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      return {
        base64: part.inlineData.data,
        mimeType: 'image/png'
      };
    }
    throw new Error("No image generated.");
  } catch (e: any) {
    const message: string = e?.message ?? e?.error?.message ?? "Image generation failed.";
    const retryAfterMatch = message.match(/retry in\s+([\d.]+)s/i);
    const retryAfterSeconds = retryAfterMatch ? Number(retryAfterMatch[1]) : undefined;

    if (e?.code === 429 || e?.status === "RESOURCE_EXHAUSTED" || message.toLowerCase().includes("quota")) {
      imageQuotaBlocked = true;
      throw new ImageQuotaError(
        "Image generation quota exceeded for this API key. Enable billing or wait for quota reset.",
        retryAfterSeconds
      );
    }

    console.error("Image generation failed:", e);
    throw e;
  }
};
