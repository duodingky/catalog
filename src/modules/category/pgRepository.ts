import type { Pool } from "pg";
import type { CategoryRepository } from "./repository.js";
import type { Category, CategoryWithParent } from "./types.js";

export class PgCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Pool) {}

  async create(input: {
    categoryName: string;
    parentId: string;
    imageUrl?: string;
    featured?: boolean;
    shortDesc?: string;
    longDesc?: string;
  }): Promise<CategoryWithParent> {
    const client = await this.db.connect();
    try {
      await client.query("begin");

      const created = await client.query<{
        id: string;
        category_name: string;
        image_url: string | null;
        featured: boolean;
        parent_id: string | null;
        short_desc: string | null;
        long_desc: string | null;
      }>(
        `
        insert into ecom.categories (category_name, parent_id, image_url, featured, short_desc, long_desc)
        values ($1, $2, $3, coalesce($4, false), $5, $6)
        returning id, category_name, parent_id, image_url, featured, short_desc, long_desc
        `,
        [
          input.categoryName,
          input.parentId === "0" ? null : input.parentId,
          input.imageUrl ?? null,
          input.featured ?? null,
          input.shortDesc ?? null,
          input.longDesc ?? null
        ]
      );

      const row = created.rows[0];
      if (!row) throw new Error("Failed to create category");

      await client.query("commit");
      return {
        id: row.id,
        categoryName: row.category_name,
        imageUrl: row.image_url,
        featured: row.featured,
        shortDesc: row.short_desc,
        longDesc: row.long_desc,
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
    input: { categoryName?: string; imageUrl?: string; featured?: boolean; shortDesc?: string; longDesc?: string; parentId?: string }
  ): Promise<CategoryWithParent | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      featured: boolean;
      parent_id: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      update ecom.categories
      set
        category_name = coalesce($2, category_name),
        image_url = coalesce($3, image_url),
        featured = coalesce($4, featured),
        short_desc = coalesce($5, short_desc),
        long_desc = coalesce($6, long_desc),
        parent_id = case
          when $7 is null then parent_id
          when $7 = '0' then null
          else $7::uuid
        end,
        updated_at = now()
      where id = $1
      returning id, category_name, parent_id, image_url, featured, short_desc, long_desc
      `,
      [
        id,
        input.categoryName ?? null,
        input.imageUrl ?? null,
        input.featured ?? null,
        input.shortDesc ?? null,
        input.longDesc ?? null,
        input.parentId ?? null
      ]
    );

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      categoryName: row.category_name,
      imageUrl: row.image_url,
      featured: row.featured,
      shortDesc: row.short_desc,
      longDesc: row.long_desc,
      parentId: row.parent_id ?? "0"
    };
  }

  async findById(id: string): Promise<Category | null> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      featured: boolean;
      short_desc: string | null;
      long_desc: string | null;
    }>("select id, category_name, image_url, featured, short_desc, long_desc from ecom.categories where id = $1", [id]);

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      categoryName: row.category_name,
      imageUrl: row.image_url,
      featured: row.featured,
      shortDesc: row.short_desc,
      longDesc: row.long_desc
    };
  }

  async findAllByName(categoryName: string): Promise<Category[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      featured: boolean;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      "select id, category_name, image_url, featured, short_desc, long_desc from ecom.categories where lower(category_name) = lower($1) order by category_name asc",
      [categoryName]
    );

    return res.rows.map((r) => ({
      id: r.id,
      categoryName: r.category_name,
      imageUrl: r.image_url,
      featured: r.featured,
      shortDesc: r.short_desc,
      longDesc: r.long_desc
    }));
  }

  async findDescendantIds(rootIds: string[]): Promise<string[]> {
    if (rootIds.length === 0) return [];

    const res = await this.db.query<{ id: string }>(
      `
      with recursive category_tree as (
        select c.id
        from ecom.categories c
        where c.id = any($1::uuid[])
        union all
        select child.id
        from ecom.categories child
        join category_tree t on child.parent_id = t.id
      )
      select distinct id
      from category_tree
      `,
      [rootIds]
    );

    return res.rows.map((r) => r.id);
  }

  async listWithParents(): Promise<CategoryWithParent[]> {
    const res = await this.db.query<{
      id: string;
      category_name: string;
      image_url: string | null;
      featured: boolean;
      parent_id: string | null;
      short_desc: string | null;
      long_desc: string | null;
    }>(
      `
      select
        c.id,
        c.category_name,
        c.image_url,
        c.featured,
        c.short_desc,
        c.long_desc,
        c.parent_id
      from ecom.categories c
      order by c.category_name asc
      `
    );

    return res.rows.map((r) => ({
      id: r.id,
      categoryName: r.category_name,
      imageUrl: r.image_url,
      featured: r.featured,
      shortDesc: r.short_desc,
      longDesc: r.long_desc,
      parentId: r.parent_id ?? "0"
    }));
  }

  async countTopLevel(): Promise<number> {
    const res = await this.db.query<{ total: string }>(
      "select count(*) as total from ecom.categories where parent_id is null"
    );
    return Number(res.rows[0]?.total ?? 0);
  }
}

