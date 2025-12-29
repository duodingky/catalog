import type { BrandRepository, CreateBrandInput, UpdateBrandInput } from "./repository.js";
import { ConflictError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";
import type { Brand } from "./types.js";

export class BrandService {
  constructor(private readonly repo: BrandRepository) {}

  async create(input: CreateBrandInput): Promise<Brand> {
    try {
      return await this.repo.create(input);
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictError("Brand name already exists");
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Brand> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError("Brand not found");
    return found;
  }

  async update(id: string, input: UpdateBrandInput): Promise<Brand> {
    try {
      const updated = await this.repo.update(id, input);
      if (!updated) throw new NotFoundError("Brand not found");
      return updated;
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictError("Brand name already exists");
      }
      throw err;
    }
  }

  async list(): Promise<Brand[]> {
    return await this.repo.list();
  }
}

