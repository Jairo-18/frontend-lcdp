import { ImageVariant } from './image-variant.interface';

export interface CategoryDto {
  name: string;
  code: string;
  images?: ImageVariant[];
}

export interface Category {
  id: number;
  name: string;
  code: string;
  images: ImageVariant[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CategoryPill {
  id: number;
  name: string;
  icon: string;
}
