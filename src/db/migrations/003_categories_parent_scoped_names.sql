-- Allow same category name under different parents by scoping uniqueness to parent.
-- Note: migration runner re-applies migrations, so keep this idempotent.

-- 1) Store parent on categories (normalized)
alter table ecom.categories
  add column if not exists parent_id uuid;

-- 2) Backfill from legacy xref table (if present). Keep "0" as root (NULL).
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'ecom' and table_name = 'categories_xref'
  ) then
    update ecom.categories c
      set parent_id = case
        when x.parent_id = '0' then null
        else x.parent_id::uuid
      end
    from ecom.categories_xref x
    where x.category_id = c.id
      and c.parent_id is null;
  end if;
end $$;

-- 3) Drop global unique constraint so duplicates are allowed across different parents
alter table ecom.categories
  drop constraint if exists categories_category_name_key;

-- 4) Enforce uniqueness within the same parent (including root)
create unique index if not exists idx_categories_parent_id_category_name_unique
  on ecom.categories (
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(category_name)
  );

