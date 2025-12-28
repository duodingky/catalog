import type { Category, CategoryWithParent } from "./types.js";

export type CreateCategoryInput = {
  categoryName: string;
  parentId?: string;
  parentCategory?: string;
};

export interface CategoryRepository {
  create(input: { categoryName: string; parentId: string }): Promise<CategoryWithParent>;
  findById(id: string): Promise<Category | null>;
  findAllByName(categoryName: string): Promise<Category[]>;
  listWithParents(): Promise<CategoryWithParent[]>;
}

