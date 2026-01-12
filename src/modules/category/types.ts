export type Category = {
  id: string;
  categoryName: string;
  imageUrl: string | null;
  featured: boolean;
  shortDesc: string | null;
  longDesc: string | null;
};

export type CategoryWithParent = Category & {
  parentId: string;
};

export type CategoryNode = Category & {
  parentId: string;
  children: CategoryNode[];
};

