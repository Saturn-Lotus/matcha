export type ApiError = {
  error: {
    code: string;
    message?: string;
    details?: Array<{ field: string; issue: string }>;
  };
};

export type ApiResponse<T> = {
  data?: T;
  error?: ApiError['error'];
};
