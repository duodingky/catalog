import type { Pool } from "pg";
import type { ProductRepository, CreateProductInput, UpdateProductInput } from "./repository.js";
import type { Product } from "./types.js";

export class PgProductRepository implements ProductRepository {
  constructor(private readonly db: Pool) {}

  async existsByNameInCategoryAndBrand(input: {
    productName: string;
    categoryId: string;
    brandId: string;
    excludeId?: string;
  }): Promise<boolean> {
    const res = await this.db.query<{ exists: boolean }>(
      `
      select exists(
        select 1
        from ecom.products p
        where lower(p.product_name) = lower($1)
          and p.category_id = $2::uuid
          and p.brand_id = $3::uuid
          and ($4::uuid is null or p.id <> $4::uuid)
      ) as exists
      `,
      [input.productName, input.categoryId, input.brandId, input.excludeId ?? null]
    );

    return res.rows[0]?.exists ?? false;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      category_name: string;
      brand_id: string;
      brand_name: string;
      price: string;
      image_url: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      insert into ecom.products (product_name, category_id, brand_id, price, image_url, short_desc, long_desc)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning
        id,
        product_name,
        category_id,
        (select c.category_name from ecom.categories c where c.id = category_id) as category_name,
        brand_id,
        (select b.brand_name from ecom.brands b where b.id = brand_id) as brand_name,
        price,
        image_url,
        short_desc,
        long_desc
      `,
      [
        input.productName,
        input.categoryId,
        input.brandId,
        input.price,
        input.imageUrl ?? null,
        input.shortDesc ?? null,
        input.longDesc ?? null
      ]
    );

    const row = res.rows[0];
    if (!row) throw new Error("Failed to create product");
    return {
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      category_name: string;
      brand_id: string;
      brand_name: string;
      price: string;
      image_url: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      update ecom.products
      set
        product_name = coalesce($2, product_name),
        category_id = coalesce($3, category_id),
        brand_id = coalesce($4, brand_id),
        price = coalesce($5, price),
        image_url = coalesce($6, image_url),
        short_desc = coalesce($7, short_desc),
        long_desc = coalesce($8, long_desc),
        updated_at = now()
      where id = $1
      returning
        id,
        product_name,
        category_id,
        (select c.category_name from ecom.categories c where c.id = category_id) as category_name,
        brand_id,
        (select b.brand_name from ecom.brands b where b.id = brand_id) as brand_name,
        price,
        image_url,
        short_desc,
        long_desc
      `,
      [
        id,
        input.productName ?? null,
        input.categoryId ?? null,
        input.brandId ?? null,
        input.price ?? null,
        input.imageUrl ?? null,
        input.shortDesc ?? null,
        input.longDesc ?? null
      ]
    );

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async findById(id: string): Promise<Product | null> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      category_name: string;
      brand_id: string;
      brand_name: string;
      price: string;
      image_url: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        p.id,
        p.product_name,
        p.category_id,
        c.category_name,
        p.brand_id,
        b.brand_name,
        p.price,
        p.image_url,
        p.short_desc,
        p.long_desc
      from ecom.products p
      join ecom.categories c on c.id = p.category_id
      join ecom.brands b on b.id = p.brand_id
      where p.id = $1
      `,
      [id]
    );

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async list(): Promise<Product[]> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      category_name: string;
      brand_id: string;
      brand_name: string;
      price: string;
      image_url: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        p.id,
        p.product_name,
        p.category_id,
        c.category_name,
        p.brand_id,
        b.brand_name,
        p.price,
        p.image_url,
        p.short_desc,
        p.long_desc
      from ecom.products p
      join ecom.categories c on c.id = p.category_id
      join ecom.brands b on b.id = p.brand_id
      order by p.product_name asc
      `
    );

    return res.rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    }));
  }

  async search(query: string): Promise<Product[]> {
    const q = `%${query}%`;
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      category_name: string;
      brand_id: string;
      brand_name: string;
      price: string;
      image_url: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        p.id,
        p.product_name,
        p.category_id,
        c.category_name,
        p.brand_id,
        b.brand_name,
        p.price,
        p.image_url,
        p.short_desc,
        p.long_desc
      from ecom.products p
      join ecom.categories c on c.id = p.category_id
      join ecom.brands b on b.id = p.brand_id
      where p.product_name ilike $1
         or coalesce(p.short_desc, '') ilike $1
         or coalesce(p.long_desc, '') ilike $1
         or c.category_name ilike $1
         or b.brand_name ilike $1
      order by p.product_name asc
      `,
      [q]
    );

    return res.rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      imageUrl: row.image_url,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    }));
  }
}

