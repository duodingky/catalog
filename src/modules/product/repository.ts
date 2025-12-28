import type { Product } from "./types.js";

export type CreateProductInput = {
  productName: string;
  categoryId: string;
  brandId: string;
  price: string;
  shortDesc?: string;
  longDesc?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductRepository {
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  list(): Promise<Product[]>;
}

