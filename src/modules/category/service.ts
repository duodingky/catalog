import type { CategoryRepository, CreateCategoryInput } from "./repository.js";
import { ConflictError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";
import type { Category, CategoryNode, CategoryWithParent } from "./types.js";

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async create(input: CreateCategoryInput): Promise<CategoryWithParent> {
    try {
      const resolvedParentId = await this.resolveParentId(input);
      return await this.repo.create({ categoryName: input.categoryName, parentId: resolvedParentId });
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictError("Category name already exists");
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Category> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    return found;
  }

  async list(): Promise<CategoryNode[]> {
    const rows = await this.repo.listWithParents();
    return buildCategoryTree(rows);
  }

  private async resolveParentId(input: CreateCategoryInput): Promise<string> {
    if (input.parentCategory) {
      const parent = await this.repo.findByName(input.parentCategory);
      if (!parent) throw new NotFoundError("Parent category not found");
      return parent.id;
    }

    const parentId = input.parentId ?? "0";
    if (parentId === "0") return "0";

    const parent = await this.repo.findById(parentId);
    if (!parent) throw new NotFoundError("Parent category not found");
    return parent.id;
  }
}

function buildCategoryTree(rows: CategoryWithParent[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const r of rows) {
    byId.set(r.id, { id: r.id, categoryName: r.categoryName, parentId: r.parentId, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId;
    if (parentId === "0") {
      roots.push(node);
      continue;
    }

    const parent = byId.get(parentId);
    if (!parent) {
      // If the parent doesn't exist (data drift), treat as top-level.
      node.parentId = "0";
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  const sortRecursively = (n: CategoryNode) => {
    n.children.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    for (const c of n.children) sortRecursively(c);
  };
  roots.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  for (const r of roots) sortRecursively(r);

  return roots;
}

