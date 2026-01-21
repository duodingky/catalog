import type { Product } from "./types.js";

export type CreateProductInput = {
  productName: string;
  sku?: string;
  categoryId: string;
  brandId: string;
  price: string;
  imageUrl?: string;
  featured?: boolean;
  shortDesc?: string;
  longDesc?: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductRepository {
  existsByNameInCategoryAndBrand(input: {
    productName: string;
    categoryId: string;
    brandId: string;
    excludeId?: string;
  }): Promise<boolean>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  list(): Promise<Product[]>;
  listPaged(input: { start: number; limit: number; featured?: boolean }): Promise<{ data: Product[]; totalRecord: number }>;
  listByCategoryId(categoryId: string): Promise<Product[]>;
  search(input: { q?: string; categoryIds?: string[]; brandIds?: string[] }): Promise<Product[]>;
}

