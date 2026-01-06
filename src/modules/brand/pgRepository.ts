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
      featured: boolean;
    }>(
      "insert into ecom.brands (brand_name, image_url, featured) values ($1, $2, coalesce($3, false)) returning id, brand_name, image_url, featured",
      [input.brandName, input.imageUrl ?? null, input.featured ?? null]
    );

    const row = res.rows[0];
    if (!row) throw new Error("Failed to create brand");
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url, featured: row.featured };
  }

  async update(id: string, input: UpdateBrandInput): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
      featured: boolean;
    }>(
      `
      update ecom.brands
      set
        brand_name = coalesce($2, brand_name),
        image_url = coalesce($3, image_url),
        featured = coalesce($4, featured),
        updated_at = now()
      where id = $1
      returning id, brand_name, image_url, featured
      `,
      [id, input.brandName ?? null, input.imageUrl ?? null, input.featured ?? null]
    );

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url, featured: row.featured };
  }

  async findById(id: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
      featured: boolean;
    }>("select id, brand_name, image_url, featured from ecom.brands where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url, featured: row.featured };
  }

  async findByName(brandName: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
      featured: boolean;
    }>("select id, brand_name, image_url, featured from ecom.brands where brand_name = $1", [brandName]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name, imageUrl: row.image_url, featured: row.featured };
  }

  async list(): Promise<Brand[]> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
      featured: boolean;
    }>("select id, brand_name, image_url, featured from ecom.brands order by brand_name asc");

    return res.rows.map((r) => ({ id: r.id, brandName: r.brand_name, imageUrl: r.image_url, featured: r.featured }));
  }

  async listPaged(input: { start: number; limit: number; featured?: boolean }): Promise<{ data: Brand[]; totalRecord: number }> {
    const countRes = await this.db.query<{ total: string }>(
      `
      select count(*) as total
      from ecom.brands
      where ($1::boolean is null or featured = $1::boolean)
      `,
      [input.featured ?? null]
    );
    const totalRecord = Number(countRes.rows[0]?.total ?? 0);

    const res = await this.db.query<{
      id: string;
      brand_name: string;
      image_url: string | null;
      featured: boolean;
    }>(
      `
      select id, brand_name, image_url, featured
      from ecom.brands
      where ($1::boolean is null or featured = $1::boolean)
      order by brand_name asc
      offset $2
      limit $3
      `,
      [input.featured ?? null, input.start, input.limit]
    );

    return {
      totalRecord,
      data: res.rows.map((r) => ({ id: r.id, brandName: r.brand_name, imageUrl: r.image_url, featured: r.featured }))
    };
  }
}

