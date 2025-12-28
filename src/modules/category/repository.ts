import type { Category, CategoryWithParent } from "./types.js";

export type CreateCategoryInput = {
  categoryName: string;
  parentId?: string;
  parentCategory?: string;
};

export interface CategoryRepository {
  create(input: { categoryName: string; parentId: string }): Promise<CategoryWithParent>;
  findById(id: string): Promise<Category | null>;
  findByName(categoryName: string): Promise<Category | null>;
  listWithParents(): Promise<CategoryWithParent[]>;
}

