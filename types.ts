
export type Currency = 'USD' | 'EUR' | 'BAM' | 'RSD' | 'GBP';

export interface FormData {
  description: string;
  location: string;
  budget: number;
  currency: Currency;
  existingName?: string;
  existingSlogan?: string;
  existingColors?: string; // Comma separated string from input
}

export interface BudgetItem {
  category: string; // e.g., "Marketing", "Operations", "Legal"
  item: string; // e.g., "Instagram Ads", "Store Rent"
  cost: number;
  frequency: 'One-time' | 'Monthly' | 'Yearly';
  reasoning: string; // Why this cost for this location?
  searchQuery?: string;
}

export interface BudgetPlan {
  items: BudgetItem[];
  totalEstimatedMonthly: number;
  totalOneTimeStartup: number;
  estimatedMonthlyRevenue: number;
  breakEvenMonths: number;
  currency: Currency;
  advice: string; // AI advice on the budget
  isFeasible: boolean;
  suggestedMinimumBudget: number;
  missingBudget: number;
}

export interface ProductIdea {
  name: string;
  description: string;
  price: number;
  visualPrompt: string;
}

export interface BrandIdentity {
  companyName: string;
  slogan: string;
  description: string;
  colorPalette: string[];
  products: ProductIdea[];
  logoStyle: string;
  budgetPlan: BudgetPlan;
  locationValid: boolean;
  normalizedLocation: string;
  businessType: 'Service' | 'Product';
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}
