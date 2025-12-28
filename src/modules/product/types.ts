export type Product = {
  id: string;
  productName: string;
  categoryId: string;
  brandId: string;
  brandName: string;
  price: string; // returned from Postgres numeric as string
  shortDesc: string | null;
  longDesc: string | null;
};

