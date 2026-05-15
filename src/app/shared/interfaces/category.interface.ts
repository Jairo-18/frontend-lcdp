import { ImageVariant } from './image-variant.interface';

export interface Category {
  id: string;
  name: string;
  code: string;
  images: ImageVariant[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CategoryPill {
  id: string;
  name: string;
  icon: string;
}
