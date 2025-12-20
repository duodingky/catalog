import type { Pool } from "pg";
import type { ProductRepository, CreateProductInput } from "./repository.js";
import type { Product } from "./types.js";

export class PgProductRepository implements ProductRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateProductInput): Promise<Product> {
    const res = await this.db.query<{
      id: string;
      product_name: string;
      category_id: string;
      brand_id: string;
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      insert into products (product_name, category_id, brand_id, price, short_desc, long_desc)
      values ($1, $2, $3, $4, $5, $6)
      returning id, product_name, category_id, brand_id, price, short_desc, long_desc
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
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select id, product_name, category_id, brand_id, price, short_desc, long_desc
      from products
      where id = $1
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
      price: string;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select id, product_name, category_id, brand_id, price, short_desc, long_desc
      from products
      order by product_name asc
      `
    );

    return res.rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      categoryId: row.category_id,
      brandId: row.brand_id,
      price: row.price,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    }));
  }
}

