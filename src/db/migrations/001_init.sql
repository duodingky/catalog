-- Enable UUID generation
create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category_id uuid not null references categories(id) on delete restrict,
  brand_id uuid not null references brands(id) on delete restrict,
  price numeric(12, 2) not null check (price >= 0),
  short_desc text,
  long_desc text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_brand_id on products(brand_id);

