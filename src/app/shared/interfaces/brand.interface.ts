import { ImageVariant } from './image-variant.interface';

export interface BrandDto {
  name: string;
  code: string;
  images?: ImageVariant[];
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  images: ImageVariant[];
  createdAt: string;
  updatedAt: string | null;
}
