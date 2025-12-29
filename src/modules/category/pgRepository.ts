import type { Pool } from "pg";
import type { CategoryRepository } from "./repository.js";
import type { Category, CategoryWithParent } from "./types.js";

export class PgCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Pool) {}

  async create(input: {
    categoryName: string;
    parentId: string;
    imageUrl?: string;
  }): Promise<CategoryWithParent> {
    const client = await this.db.connect();
    try {
      await client.query("begin");

      const created = await client.query<{
        id: string;
        category_name: string;
        image_url: string | null;
        parent_id: string | null;
      }>(
        `
        insert into ecom.categories (category_name, parent_id, image_url)
        values ($1, $2, $3)
        returning id, category_name, parent_id, image_url
        `,
        [input.categoryName, input.parentId === "0" ? null : input.parentId, input.imageUrl ?? null]
      );

      const row = created.rows[0];
      if (!row) throw new Error("Failed to create category");

      await client.query("commit");
      return {
        id: row.id,
        categoryName: row.category_name,
        imageUrl: row.image_url,
        parentId: row.parent_id ?? "0"
      };
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }

  async update(
    id: string,
    input: { categoryName?: string; imageUrl?: string; parentId?: string }
  ): Promise<CategoryWithParent | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      parent_id: string | null;
    }>(
      `
      update ecom.categories
      set
        category_name = coalesce($2, category_name),
        image_url = coalesce($3, image_url),
        parent_id = case
          when $4 is null then parent_id
          when $4 = '0' then null
          else $4::uuid
        end,
        updated_at = now()
      where id = $1
      returning id, category_name, parent_id, image_url
      `,
      [id, input.categoryName ?? null, input.imageUrl ?? null, input.parentId ?? null]
    );

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      categoryName: row.category_name,
      imageUrl: row.image_url,
      parentId: row.parent_id ?? "0"
    };
  }

  async findById(id: string): Promise<Category | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
    }>("select id, category_name, image_url from ecom.categories where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, categoryName: row.category_name, imageUrl: row.image_url };
  }

  async findAllByName(categoryName: string): Promise<Category[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
    }>(
      "select id, category_name, image_url from ecom.categories where lower(category_name) = lower($1) order by category_name asc",
      [categoryName]
    );

    return res.rows.map((r) => ({ id: r.id, categoryName: r.category_name, imageUrl: r.image_url }));
  }

  async listWithParents(): Promise<CategoryWithParent[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      parent_id: string | null;
    }>(
      `
      select
        c.id,
        c.category_name,
        c.image_url,
        c.parent_id
      from ecom.categories c
      order by c.category_name asc
      `
    );

    return res.rows.map((r) => ({
      id: r.id,
      categoryName: r.category_name,
      imageUrl: r.image_url,
      parentId: r.parent_id ?? "0"
    }));
  }
}

