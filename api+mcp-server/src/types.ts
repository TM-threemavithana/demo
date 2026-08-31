export type SpiceProduct = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: "whole" | "ground" | "blend";
  origin: string;
  priceLkr: number;
  packageGrams: number;
  stockQuantity: number;
  active: boolean;
};

export type ProductSearch = {
  query?: string;
  category?: SpiceProduct["category"];
  maxPriceLkr?: number;
  inStockOnly?: boolean;
  limit?: number;
};

export type ProductListOptions = {
  category?: SpiceProduct["category"];
  inStockOnly?: boolean;
  includeInactive?: boolean;
  limit?: number;
};

export type ProductRecommendationInput = {
  need: string;
  budgetLkr?: number;
  inStockOnly?: boolean;
  limit?: number;
};
