import type { Pool } from "pg";
import type { ProductRepository, CreateProductInput, UpdateProductInput } from "./repository.js";
import type { Product } from "./types.js";

export class PgProductRepository implements ProductRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateProductInput): Promise<Product> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      brand_id: string;
      brand_name: string;
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      insert into ecom.products (product_name, category_id, brand_id, price, short_desc, long_desc)
      values ($1, $2, $3, $4, $5, $6)
      returning
        id,
        product_name,
        category_id,
        brand_id,
        (select b.brand_name from ecom.brands b where b.id = brand_id) as brand_name,
        price,
        short_desc,
        long_desc
      `,
      [
        input.productName,
        input.categoryId,
        input.brandId,
        input.price,
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
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      brand_id: string;
      brand_name: string;
      price: string;
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
        short_desc = coalesce($6, short_desc),
        long_desc = coalesce($7, long_desc),
        updated_at = now()
      where id = $1
      returning
        id,
        product_name,
        category_id,
        brand_id,
        (select b.brand_name from ecom.brands b where b.id = brand_id) as brand_name,
        price,
        short_desc,
        long_desc
      `,
      [
        id,
        input.productName ?? null,
        input.categoryId ?? null,
        input.brandId ?? null,
        input.price ?? null,
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
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async findById(id: string): Promise<Product | null> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      brand_id: string;
      brand_name: string;
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        p.id,
        p.product_name,
        p.category_id,
        p.brand_id,
        b.brand_name,
        p.price,
        p.short_desc,
        p.long_desc
      from ecom.products p
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
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async list(): Promise<Product[]> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      brand_id: string;
      brand_name: string;
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        p.id,
        p.product_name,
        p.category_id,
        p.brand_id,
        b.brand_name,
        p.price,
        p.short_desc,
        p.long_desc
      from ecom.products p
      join ecom.brands b on b.id = p.brand_id
      order by p.product_name asc
      `
    );

    return res.rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      brandId: row.brand_id,
      brandName: row.brand_name,
      price: row.price,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    }));
  }
}

