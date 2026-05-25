import { BasePaginationParams } from './pagination.interface';

export interface ColorDto {
  name: string;
  hex: string;
  colorFamily?: string;
  code?: string;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
  colorFamily: string | null;
  code: string | null;
}

export interface ColorParams extends BasePaginationParams {
  colorFamily?: string;
}
