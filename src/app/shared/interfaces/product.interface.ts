import { Category } from './category.interface';
import { Brand } from './brand.interface';
import { TaxType } from './tax-type.interface';
import { PaginationParams } from './pagination.interface';
import { ImageVariant } from './image-variant.interface';

export interface UnitOfMeasureDto {
  name: string;
  code: string;
}

export interface CreatePresentationDto {
  unitOfMeasureId: number;
  sku?: string;
  images?: ImageVariant[];
}

export interface CreateProductDto {
  name: string;
  code?: string;
  description?: string;
  categoryId: number;
  brandId: number;
  priceSale?: number;
  taxTypeId?: number;
  isActive?: boolean;
  videoUrl?: string;
  technicalSheet?: Record<string, string | number | boolean>;
  presentations?: CreatePresentationDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductParams extends PaginationParams {
  search?: string;
  categoryId?: number;
  brandId?: number;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductImage {
  id: number;
  presentationId: number;
  variants: ImageVariant;
  order: number;
  createdAt: string;
}

export interface ProductPresentation {
  id: number;
  productId: number;
  unitOfMeasureId: number;
  unitOfMeasure: UnitOfMeasure;
  sku: string | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string | null;
}

export interface Product {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  categoryId: number;
  category: Category;
  brandId: number;
  brand: Brand;
  priceSale: number | null;
  taxTypeId: number | null;
  taxType: TaxType | null;
  isActive: boolean;
  technicalSheet: Record<string, string | number | boolean> | null;
  videoUrl: string | null;
  presentations: ProductPresentation[];
  createdAt: string;
  updatedAt: string | null;
}
