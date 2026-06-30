export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(message: string): ApiResponse<null> {
  return { success: false, message };
}
