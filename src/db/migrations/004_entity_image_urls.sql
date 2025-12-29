-- Add optional image URLs to core entities.
-- Keep idempotent because the migration runner re-applies all migrations.

alter table ecom.categories
  add column if not exists image_url text;

alter table ecom.brands
  add column if not exists image_url text;

alter table ecom.products
  add column if not exists image_url text;

