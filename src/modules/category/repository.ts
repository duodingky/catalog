import type { Category, CategoryWithParent } from "./types.js";

export type CreateCategoryInput = {
  categoryName: string;
  imageUrl?: string;
  featured?: boolean;
  shortDesc?: string;
  longDesc?: string;
  parentId?: string;
  parentCategory?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryRepository {
  create(input: {
    categoryName: string;
    parentId: string;
    imageUrl?: string;
    featured?: boolean;
    shortDesc?: string;
    longDesc?: string;
  }): Promise<CategoryWithParent>;
  update(
    id: string,
    input: {
      categoryName?: string;
      imageUrl?: string;
      featured?: boolean;
      shortDesc?: string;
      longDesc?: string;
      parentId?: string;
    }
  ): Promise<CategoryWithParent | null>;
  findById(id: string): Promise<Category | null>;
  findAllByName(categoryName: string): Promise<Category[]>;
  listWithParents(): Promise<CategoryWithParent[]>;
  countTopLevel(): Promise<number>;
}

