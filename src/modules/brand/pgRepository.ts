import type { Pool } from "pg";
import type { BrandRepository, CreateBrandInput, UpdateBrandInput } from "./repository.js";
import type { Brand } from "./types.js";

export class PgBrandRepository implements BrandRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateBrandInput): Promise<Brand> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
    }>(
      "insert into ecom.brands (brand_name, image_url) values ($1, $2) returning id, brand_name, image_url",
      [input.brandName, input.imageUrl ?? null]
    );

    const row = res.rows[0];
    if (!row) throw new Error("Failed to create brand");
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url };
  }

  async update(id: string, input: UpdateBrandInput): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
    }>(
      `
      update ecom.brands
      set
        brand_name = coalesce($2, brand_name),
        image_url = coalesce($3, image_url),
        updated_at = now()
      where id = $1
      returning id, brand_name, image_url
      `,
      [id, input.brandName ?? null, input.imageUrl ?? null]
    );

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url };
  }

  async findById(id: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
    }>("select id, brand_name, image_url from ecom.brands where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url };
  }

  async findByName(brandName: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
    }>("select id, brand_name, image_url from ecom.brands where brand_name = $1", [brandName]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url };
  }

  async list(): Promise<Brand[]> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
    }>("select id, brand_name, image_url from ecom.brands order by brand_name asc");

    return res.rows.map((r) => ({ id: r.id, brandName: r.brand_name, imageUrl: r.image_url }));
  }
}

