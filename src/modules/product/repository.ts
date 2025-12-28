import type { Product } from "./types.js";

export type CreateProductInput = {
  productName: string;
  categoryId: string;
  brandId: string;
  price: string;
  shortDesc?: string;
  longDesc?: string;
};

export interface ProductRepository {
  create(input: CreateProductInput): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  list(): Promise<Product[]>;
}

