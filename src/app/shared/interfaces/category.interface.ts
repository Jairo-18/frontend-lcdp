export interface Category {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CategoryPill {
  id: string;
  name: string;
  icon: string;
}
