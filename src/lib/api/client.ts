import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiError } from './types';

const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  ValidationError: 'Please check your information and try again',
  NotFoundError: 'The requested resource was not found',
  UnauthorizedError: 'Invalid credentials. Please check your username and password',
  ForbiddenError: 'You do not have permission to access this resource',
  ConflictError: 'This information already exists in our system',
  NetworkError: 'Unable to connect. Please check your internet connection',
  TimeoutError: 'The request took too long. Please try again',
  ServerError: 'Something went wrong on our end. Please try again later',
};

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        return Promise.reject(this.handleError(error));
      },
    );
  }

  private handleError(error: AxiosError<ApiError>): Error {
    if (error.code === 'ECONNABORTED') {
      return new Error(USER_FRIENDLY_MESSAGES.TimeoutError);
    }

    if (!error.response) {
      return new Error(USER_FRIENDLY_MESSAGES.NetworkError);
    }

    const apiError = error.response.data?.error;
    const errorCode = apiError?.code;
    const errorMessage = apiError?.message;

    const userFriendlyMessage =
      errorCode && USER_FRIENDLY_MESSAGES[errorCode]
        ? USER_FRIENDLY_MESSAGES[errorCode]
        : errorMessage || USER_FRIENDLY_MESSAGES.ServerError;

    return new Error(userFriendlyMessage);
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, { params });
    return response.data;
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const headers = data instanceof FormData ? { 'Content-Type': undefined } : {};
    const response: AxiosResponse<T> = await this.client.patch(url, data, { headers });
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
