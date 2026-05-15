export interface Organizational {
  id: string;
  name: string;
  legalName?: string;
  nit?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  mapsUrl?: string;
  description?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  missionTitle?: string;
  missionDescription?: string;
  visionTitle?: string;
  visionDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: boolean;
}

export type UpdateOrganizationalDto = Partial<Omit<Organizational, 'id' | 'status'>>;
export type CreateOrganizationalDto = UpdateOrganizationalDto & { name: string };

import { Category } from './category.interface';
import { UnitOfMeasure } from './product.interface';

export interface BootstrapData {
  org: Organizational | null;
  categories: Category[];
  units: UnitOfMeasure[];
}
