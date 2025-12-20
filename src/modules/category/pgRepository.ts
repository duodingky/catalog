import type { Pool } from "pg";
import type { CategoryRepository, CreateCategoryInput } from "./repository.js";
import type { Category } from "./types.js";

export class PgCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateCategoryInput): Promise<Category> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>(
      "insert into categories (category_name) values ($1) returning id, category_name",
      [input.categoryName]
    );

    const row = res.rows[0];
    if (!row) throw new Error("Failed to create category");
    return { id: row.id, categoryName: row.category_name };
  }

  async findById(id: string): Promise<Category | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>("select id, category_name from categories where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, categoryName: row.category_name };
  }

  async list(): Promise<Category[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>("select id, category_name from categories order by category_name asc");

    return res.rows.map((r) => ({ id: r.id, categoryName: r.category_name }));
  }
}

