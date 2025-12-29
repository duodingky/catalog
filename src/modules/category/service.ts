import type { CategoryRepository, CreateCategoryInput, UpdateCategoryInput } from "./repository.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";
import type { Category, CategoryNode, CategoryWithParent } from "./types.js";

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async create(input: CreateCategoryInput): Promise<CategoryWithParent> {
    try {
      const resolvedParentId = await this.resolveParentId(input);
      return await this.repo.create({
        categoryName: input.categoryName,
        parentId: resolvedParentId,
        imageUrl: input.imageUrl
      });
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictError("Category name already exists under this parent category");
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Category> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    return found;
  }

  async getByIdWithChildren(id: string): Promise<CategoryNode> {
    const rows = await this.repo.listWithParents();
    const tree = buildCategoryTree(rows);
    const found = findNode(tree, id);
    if (!found) throw new NotFoundError("Category not found");
    return found;
  }

  async list(): Promise<CategoryNode[]> {
    const rows = await this.repo.listWithParents();
    return buildCategoryTree(rows);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryWithParent> {
    try {
      let resolvedParentId: string | undefined;
      if (input.parentId !== undefined || input.parentCategory !== undefined) {
        resolvedParentId = await this.resolveParentId({
          categoryName: input.categoryName ?? "",
          parentId: input.parentId,
          parentCategory: input.parentCategory
        });
      }

      if (resolvedParentId !== undefined && resolvedParentId !== "0" && resolvedParentId === id) {
        throw new BadRequestError("A category cannot be its own parent");
      }

      const updated = await this.repo.update(id, {
        categoryName: input.categoryName,
        imageUrl: input.imageUrl,
        parentId: resolvedParentId
      });

      if (!updated) throw new NotFoundError("Category not found");
      return updated;
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictError("Category name already exists under this parent category");
      }
      throw err;
    }
  }

  private async resolveParentId(input: CreateCategoryInput): Promise<string> {
    if (input.parentCategory) {
      const matches = await this.repo.findAllByName(input.parentCategory);
      if (matches.length === 0) throw new NotFoundError("Parent category not found");
      if (matches.length > 1) {
        throw new BadRequestError("Parent category name is ambiguous; please provide parentId instead");
      }
      return matches[0]!.id;
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
    byId.set(r.id, {
      id: r.id,
      categoryName: r.categoryName,
      imageUrl: r.imageUrl,
      parentId: r.parentId,
      children: []
    });
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

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const inChild = findNode(n.children, id);
    if (inChild) return inChild;
  }
  return null;
}

