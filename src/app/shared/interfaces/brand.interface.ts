import { ImageVariant } from './image-variant.interface';

export interface BrandDto {
  name: string;
  code: string;
  images?: ImageVariant[];
  isActive?: boolean;
}

export interface Brand {
  id: number;
  name: string;
  code: string;
  images: ImageVariant[];
  isActive: boolean;
}
