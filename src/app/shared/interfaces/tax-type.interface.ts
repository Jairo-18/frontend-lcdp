export interface TaxTypeDto {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface TaxType {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}
