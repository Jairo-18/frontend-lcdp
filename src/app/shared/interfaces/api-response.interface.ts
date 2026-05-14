export interface ApiResponseInterface<T> {
  statusCode: number;
  message?: string;
  data: T;
  error?: string;
}

export interface CreatedResponseInterface {
  statusCode: number;
  message: string;
  data: { rowId: string };
}
