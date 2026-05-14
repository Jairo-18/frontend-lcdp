import { Category } from './category.interface';
import { Brand } from './brand.interface';

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
