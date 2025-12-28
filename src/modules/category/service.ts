import type { CategoryRepository, CreateCategoryInput } from "./repository.js";
import { ConflictError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";
import type { Category } from "./types.js";

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async create(input: CreateCategoryInput): Promise<Category> {
    try {
      return await this.repo.create(input);
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

  async list(): Promise<Category[]> {
    return await this.repo.list();
  }
}

