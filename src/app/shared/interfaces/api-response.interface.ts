export interface ApiResponseInterface<T> {
  statusCode: number;
  message?: string;
  data: T;
}
