export interface TaxTypeDto {
  name: string;
  code: string;
}

export interface TaxType {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string | null;
}
