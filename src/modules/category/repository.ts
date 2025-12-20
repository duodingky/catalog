import type { Category } from "./types.js";

export type CreateCategoryInput = {
  categoryName: string;
};

export interface CategoryRepository {
  create(input: CreateCategoryInput): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  list(): Promise<Category[]>;
}

