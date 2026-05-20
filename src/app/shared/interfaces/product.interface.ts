import { Category } from './category.interface';
import { Brand } from './brand.interface';
import { TaxType } from './tax-type.interface';
import { BasePaginationParams } from './pagination.interface';
import { ImageVariant } from './image-variant.interface';

export interface UnitOfMeasureDto {
  name: string;
  code: string;
}

export interface CreatePresentationDto {
  unitOfMeasureId: number;
  sku?: string;
  priceSale?: number;
  images?: ImageVariant[];
}

export interface CreateProductDto {
  name: string;
  code?: string;
  description?: string;
  categoryIds: number[];
  brandId: number;
  priceSale?: number;
  taxTypeId?: number;
  isActive?: boolean;
  videoUrl?: string;
  technicalSheet?: Record<string, string | number | boolean>;
  presentations?: CreatePresentationDto[];
  markupPercentage?: number;
  discountPercentage?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface PresentationFormRaw {
  unitOfMeasureId: string;
  sku: string;
  priceSale: number | null;
}

export interface ProductParams extends BasePaginationParams {
  search?: string;
  categoryId?: number;
  brandId?: number;
  orderBy?: 'name' | 'createdAt';
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  code: string;
}

export interface ProductImage {
  id: number;
  presentationId: number;
  variants: ImageVariant;
  order: number;
}

export interface ProductPresentation {
  id: number;
  productId: number;
  unitOfMeasureId: number;
  unitOfMeasure: UnitOfMeasure;
  sku: string | null;
  priceSale: number | null;
  images: ProductImage[];
}

export interface Product {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  categories: Category[];
  brandId: number;
  brand: Brand;
  priceSale: number | null;
  taxTypeId: number | null;
  taxType: TaxType | null;
  isActive: boolean;
  technicalSheet: Record<string, string | number | boolean> | null;
  videoUrl: string | null;
  presentations: ProductPresentation[];
  markupPercentage: number | null;
  discountPercentage: number | null;
}
