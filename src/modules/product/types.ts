export type Product = {
  id: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  price: string; // returned from Postgres numeric as string
  imageUrl: string | null;
  shortDesc: string | null;
  longDesc: string | null;
};

