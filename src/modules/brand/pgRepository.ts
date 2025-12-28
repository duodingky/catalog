import type { Pool } from "pg";
import type { BrandRepository, CreateBrandInput } from "./repository.js";
import type { Brand } from "./types.js";

export class PgBrandRepository implements BrandRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateBrandInput): Promise<Brand> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
    }>("insert into ecom.brands (brand_name) values ($1) returning id, brand_name", [
      input.brandName
    ]);

    const row = res.rows[0];
    if (!row) throw new Error("Failed to create brand");
    return { id: row.id, brandName: row.brand_name };
  }

  async findById(id: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
    }>("select id, brand_name from ecom.brands where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name };
  }

  async findByName(brandName: string): Promise<Brand | null> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
    }>("select id, brand_name from ecom.brands where brand_name = $1", [brandName]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, brandName: row.brand_name };
  }

  async list(): Promise<Brand[]> {
    const res = await this.db.query<{
      id: string;
      brand_name: string;
    }>("select id, brand_name from ecom.brands order by brand_name asc");

    return res.rows.map((r) => ({ id: r.id, brandName: r.brand_name }));
  }
}

