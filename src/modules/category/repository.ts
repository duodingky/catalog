import type { Category, CategoryWithParent } from "./types.js";

export type CreateCategoryInput = {
  categoryName: string;
  imageUrl?: string;
  featured?: boolean;
  parentId?: string;
  parentCategory?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryRepository {
  create(input: { categoryName: string; parentId: string; imageUrl?: string; featured?: boolean }): Promise<CategoryWithParent>;
  update(
    id: string,
    input: { categoryName?: string; imageUrl?: string; featured?: boolean; parentId?: string }
  ): Promise<CategoryWithParent | null>;
  findById(id: string): Promise<Category | null>;
  findAllByName(categoryName: string): Promise<Category[]>;
  listWithParents(): Promise<CategoryWithParent[]>;
  countTopLevel(): Promise<number>;
}

