import { ImageVariant } from './image-variant.interface';

export interface Brand {
  id: string;
  name: string;
  code: string;
  images: ImageVariant[];
  createdAt: string;
  updatedAt: string | null;
}
