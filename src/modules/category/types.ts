export type Category = {
  id: string;
  categoryName: string;
  imageUrl: string | null;
  featured: boolean;
};

export type CategoryWithParent = Category & {
  parentId: string;
};

export type CategoryNode = Category & {
  parentId: string;
  children: CategoryNode[];
};

