import type { Brand } from "./types.js";

export type CreateBrandInput = {
  brandName: string;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

export interface BrandRepository {
  create(input: CreateBrandInput): Promise<Brand>;
  update(id: string, input: UpdateBrandInput): Promise<Brand | null>;
  findById(id: string): Promise<Brand | null>;
  findByName(brandName: string): Promise<Brand | null>;
  list(): Promise<Brand[]>;
}

