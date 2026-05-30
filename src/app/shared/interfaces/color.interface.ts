import { BasePaginationParams } from './pagination.interface';

export interface ColorDto {
  name: string;
  hex: string;
  colorFamily?: string;
  code?: string;
  isActive?: boolean;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
  colorFamily: string | null;
  code: string | null;
  isActive: boolean;
}

export interface ColorParams extends BasePaginationParams {
  colorFamily?: string;
}
