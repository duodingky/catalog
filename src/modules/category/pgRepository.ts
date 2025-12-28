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
      }>(
        "insert into ecom.categories (category_name) values ($1) returning id, category_name",
        [input.categoryName]
      );

      const row = created.rows[0];
      if (!row) throw new Error("Failed to create category");

      await client.query(
        "insert into ecom.categories_xref (parent_id, category_id) values ($1, $2)",
        [input.parentId, row.id]
      );

      await client.query("commit");
      return { id: row.id, categoryName: row.category_name, parentId: input.parentId };
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

  async findByName(categoryName: string): Promise<Category | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
    }>(
      "select id, category_name from ecom.categories where lower(category_name) = lower($1) limit 1",
      [categoryName]
    );

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, categoryName: row.category_name };
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
        x.parent_id
      from ecom.categories c
      left join ecom.categories_xref x on x.category_id = c.id
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

