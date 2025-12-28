import type { Pool } from "pg";
import type { CategoryRepository } from "./repository.js";
import type { Category, CategoryWithParent } from "./types.js";

export class PgCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Pool) {}

  async create(input: { categoryName: string; parentId: string }): Promise<CategoryWithParent> {
    const client = await this.db.connect();
    try {
      await client.query("begin");

      const created = await client.query<{
        id: string;
        category_name: string;
        parent_id: string | null;
      }>(
        "insert into ecom.categories (category_name, parent_id) values ($1, $2) returning id, category_name, parent_id",
        [input.categoryName, input.parentId === "0" ? null : input.parentId]
      );

      const row = created.rows[0];
      if (!row) throw new Error("Failed to create category");

      await client.query("commit");
      return { id: row.id, categoryName: row.category_name, parentId: row.parent_id ?? "0" };
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Category | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>("select id, category_name from ecom.categories where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, categoryName: row.category_name };
  }

  async findAllByName(categoryName: string): Promise<Category[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>(
      "select id, category_name from ecom.categories where lower(category_name) = lower($1) order by category_name asc",
      [categoryName]
    );

    return res.rows.map((r) => ({ id: r.id, categoryName: r.category_name }));
  }

  async listWithParents(): Promise<CategoryWithParent[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      parent_id: string | null;
    }>(
      `
      select
        c.id,
        c.category_name,
        c.parent_id
      from ecom.categories c
      order by c.category_name asc
      `
    );

    return res.rows.map((r) => ({
      id: r.id,
      categoryName: r.category_name,
      parentId: r.parent_id ?? "0"
    }));
  }
}

