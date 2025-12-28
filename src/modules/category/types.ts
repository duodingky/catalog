export type Category = {
  id: string;
  categoryName: string;
};

export type CategoryWithParent = Category & {
  parentId: string;
};

export type CategoryNode = Category & {
  parentId: string;
  children: CategoryNode[];
};

