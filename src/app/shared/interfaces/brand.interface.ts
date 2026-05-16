import { ImageVariant } from './image-variant.interface';

export interface BrandDto {
  name: string;
  code: string;
  images?: ImageVariant[];
}

export interface Brand {
  id: number;
  name: string;
  code: string;
  images: ImageVariant[];
  createdAt: string;
  updatedAt: string | null;
}
