import { Category } from './category.interface';
import { Brand } from './brand.interface';
import { PaginationParams } from './pagination.interface';

export interface UnitOfMeasureDto {
  name: string;
  code: string;
}

export interface CreatePresentationDto {
  unitOfMeasureId: string;
  sku?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  categoryId: string;
  brandId: string;
  videoUrl?: string;
  technicalSheet?: Record<string, string | number | boolean>;
  presentations?: CreatePresentationDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductParams extends PaginationParams {
  categoryId?: string;
  brandId?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductImage {
  id: string;
  presentationId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface ProductPresentation {
  id: string;
  productId: string;
  unitOfMeasureId: string;
  unitOfMeasure: UnitOfMeasure;
  sku: string | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: Category;
  brandId: string;
  brand: Brand;
  technicalSheet: Record<string, string | number | boolean> | null;
  videoUrl: string | null;
  presentations: ProductPresentation[];
  createdAt: string;
  updatedAt: string | null;
}
