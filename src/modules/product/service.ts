import type { BrandRepository } from "../brand/repository.js";
import type { CategoryRepository } from "../category/repository.js";
import type { ProductRepository, CreateProductInput, UpdateProductInput } from "./repository.js";
import type { Product } from "./types.js";
import { BadRequestError, NotFoundError } from "../../shared/errors.js";
import { isPgError, PG_ERROR } from "../../shared/pgErrors.js";

export type CreateOrUpdateProductRequest = Omit<CreateProductInput, "brandId"> & {
  brandId?: string;
  brandName?: string;
};

export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly brandRepo: BrandRepository,
    private readonly categoryRepo: CategoryRepository
  ) {}

  private async validateCategoryId(categoryId: string): Promise<void> {
    const found = await this.categoryRepo.findById(categoryId);
    if (!found) throw new BadRequestError("Invalid categoryId");
  }

  private async validateProductNameAvailable(input: {
    productName: string;
    categoryId: string;
    brandId: string;
    excludeId?: string;
  }): Promise<void> {
    const exists = await this.repo.existsByNameInCategoryAndBrand(input);
    if (exists) throw new BadRequestError("productName is already exist");
  }

  private async resolveBrandId(input: { brandId?: string; brandName?: string }): Promise<string> {
    if (input.brandId) {
      const found = await this.brandRepo.findById(input.brandId);
      if (!found) throw new BadRequestError("Invalid brandId");
      return input.brandId;
    }
    if (!input.brandName) throw new BadRequestError("Provide brandId or brandName");

    const existing = await this.brandRepo.findByName(input.brandName);
    if (existing) return existing.id;

    try {
      const created = await this.brandRepo.create({ brandName: input.brandName });
      return created.id;
    } catch (err) {
      // handle create race: another request might have created the brand
      if (isPgError(err) && err.code === PG_ERROR.UNIQUE_VIOLATION) {
        const found = await this.brandRepo.findByName(input.brandName);
        if (found) return found.id;
      }
      throw err;
    }
  }

  async create(input: CreateOrUpdateProductRequest): Promise<Product> {
    try {
      await this.validateCategoryId(input.categoryId);
      const brandId = await this.resolveBrandId(input);
      await this.validateProductNameAvailable({
        productName: input.productName,
        categoryId: input.categoryId,
        brandId
      });
      return await this.repo.create({
        productName: input.productName,
        categoryId: input.categoryId,
        brandId,
        price: input.price,
        imageUrl: input.imageUrl,
        shortDesc: input.shortDesc,
        longDesc: input.longDesc
      });
    } catch (err) {
      if (isPgError(err) && err.code === PG_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestError("Invalid categoryId or brandId");
      }
      throw err;
    }
  }

  async update(id: string, input: Partial<CreateOrUpdateProductRequest>): Promise<Product> {
    try {
      const existing = await this.repo.findById(id);
      if (!existing) throw new NotFoundError("Product not found");

      const nextCategoryId = input.categoryId ?? existing.categoryId;
      const nextProductName = input.productName ?? existing.productName;

      if (input.categoryId !== undefined) await this.validateCategoryId(nextCategoryId);

      let nextBrandId = existing.brandId;
      if (input.brandId || input.brandName) {
        nextBrandId = await this.resolveBrandId({
          brandId: input.brandId,
          brandName: input.brandName
        });
      }

      await this.validateProductNameAvailable({
        productName: nextProductName,
        categoryId: nextCategoryId,
        brandId: nextBrandId,
        excludeId: id
      });

      const updateInput: UpdateProductInput = {
        productName: input.productName,
        categoryId: input.categoryId,
        price: input.price,
        imageUrl: input.imageUrl,
        shortDesc: input.shortDesc,
        longDesc: input.longDesc
      };

      if (input.brandId || input.brandName) updateInput.brandId = nextBrandId;

      const updated = await this.repo.update(id, updateInput);
      if (!updated) throw new NotFoundError("Product not found");
      return updated;
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

  async search(query: string): Promise<Product[]> {
    return await this.repo.search(query);
  }
}

