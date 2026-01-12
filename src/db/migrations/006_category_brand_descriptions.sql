-- Add optional descriptions to categories and brands.
-- Keep idempotent because the migration runner re-applies all migrations.

-- Categories
alter table ecom.categories
  add column if not exists short_desc text;

alter table ecom.categories
  add column if not exists long_desc text;

-- Brands
alter table ecom.brands
  add column if not exists short_desc text;

alter table ecom.brands
  add column if not exists long_desc text;

