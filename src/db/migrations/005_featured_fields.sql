-- Add "featured" flags to core entities.
-- Keep idempotent because the migration runner re-applies all migrations.

-- Categories
alter table ecom.categories
  add column if not exists featured boolean;

alter table ecom.categories
  alter column featured set default false;

update ecom.categories
  set featured = false
  where featured is null;

alter table ecom.categories
  alter column featured set not null;

-- Brands
alter table ecom.brands
  add column if not exists featured boolean;

alter table ecom.brands
  alter column featured set default false;

update ecom.brands
  set featured = false
  where featured is null;

alter table ecom.brands
  alter column featured set not null;

-- Products
alter table ecom.products
  add column if not exists featured boolean;

alter table ecom.products
  alter column featured set default false;

update ecom.products
  set featured = false
  where featured is null;

alter table ecom.products
  alter column featured set not null;

