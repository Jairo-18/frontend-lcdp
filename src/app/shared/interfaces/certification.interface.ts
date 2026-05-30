export interface CertificationDto {
  name: string;
  normCode: string;
  certifyingBody?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Certification {
  id: number;
  name: string;
  normCode: string;
  certifyingBody: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
}
