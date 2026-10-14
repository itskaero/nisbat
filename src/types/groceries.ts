export type GroceryCategoryId =
  | "grains"
  | "pulses"
  | "essentials"
  | "vegetables"
  | "fruits"
  | "dairy"
  | "meat"
  | "bakery"
  | "beverages"
  | "household"
  | "personal"
  | "baby"
  | "snacks"
  | "frozen"
  | "other";

export const GROCERY_UNITS = [
  "kg",
  "g",
  "litre",
  "ml",
  "dozen",
  "piece",
  "packet",
  "bag",
  "bottle",
  "box",
  "bunch",
  "tin",
  "pao",
] as const;

export type GroceryUnit = (typeof GROCERY_UNITS)[number];

export interface GroceryCategory {
  id: GroceryCategoryId;
  name: string;
  nameUr: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  nameUr?: string;
  category: GroceryCategoryId;
  unit: GroceryUnit;
  /** Human readable pack size, e.g. "1 L pouch". */
  pack?: string;
  /**
   * Rough sample estimate per unit in PKR. NOT a live market price.
   * Shown with an explicit "sample estimate" label.
   */
  sampleUnitPrice?: number;
  /** Wikipedia article used to look up an openly licensed lead image. */
  wiki?: string;
}

export interface ProductImage {
  src: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
}

export type PriceSource = "pbs" | "sample" | "user";

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: GroceryCategoryId;
  quantity: number;
  unit: GroceryUnit;
  /** User-entered (or sample-prefilled, then confirmed) unit price in PKR. */
  unitPrice?: number;
  priceIsSample?: boolean;
  priceSource?: PriceSource;
  priceNote?: string;
  notes?: string;
  purchased: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
