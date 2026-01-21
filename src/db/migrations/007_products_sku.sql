-- Add SKU field to products.

alter table ecom.products
  add column if not exists sku text;
