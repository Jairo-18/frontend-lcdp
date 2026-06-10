import { BasePaginationParams } from './pagination.interface';

export type ColorSurface = 'piso' | 'pared' | 'techo';

export const COLOR_FAMILIES: string[] = [
  'Amarillos',
  'Azules',
  'Blancos',
  'Grises',
  'Morados',
  'Naranjas',
  'Negros',
  'Neutros',
  'Rojos',
  'Rosas',
  'Verdes',
];

export const COLOR_SURFACE_OPTIONS: { value: ColorSurface; label: string }[] = [
  { value: 'piso',  label: 'Pisos'   },
  { value: 'pared', label: 'Paredes' },
  { value: 'techo', label: 'Techos'  },
];

export interface ColorDto {
  name: string;
  hex: string;
  colorFamily?: string;
  code?: string;
  surfaces?: ColorSurface[];
  isActive?: boolean;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
  colorFamily: string | null;
  code: string | null;
  surfaces: ColorSurface[] | null;
  isActive: boolean;
}

export interface ColorParams extends BasePaginationParams {
  colorFamily?: string;
}
