import type { Brand } from "./types.js";

export type CreateBrandInput = {
  brandName: string;
};

export interface BrandRepository {
  create(input: CreateBrandInput): Promise<Brand>;
  findById(id: string): Promise<Brand | null>;
  list(): Promise<Brand[]>;
}

