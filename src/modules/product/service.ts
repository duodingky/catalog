import type { ProductRepository, CreateProductInput } from "./repository.js";
import type { Product } from "./types.js";
import { BadRequestError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";

export class ProductService {
  constructor(private readonly repo: ProductRepository) {}

  async create(input: CreateProductInput): Promise<Product> {
    try {
      return await this.repo.create(input);
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestError("Invalid categoryId or brandId");
      }
      throw err;
    }
  }

  async getById(id: string): Promise<Product> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError("Product not found");
    return found;
  }

  async list(): Promise<Product[]> {
    return await this.repo.list();
  }
}

