create table if not exists ecom.categories_xref (
  id bigserial primary key,
  parent_id text not null,
  category_id uuid not null references ecom.categories(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One parent per category (tree), but a parent can have many children
create unique index if not exists idx_categories_xref_category_id_unique
  on ecom.categories_xref(category_id);

create index if not exists idx_categories_xref_parent_id
  on ecom.categories_xref(parent_id);

