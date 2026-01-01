import type { ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API_PREFIX = '/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig {
  headers?: Record<string, string>;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config?.headers,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    throw new ApiClientError(
      (data as ApiError).error ?? 'Request failed',
      response.status,
      data as ApiError
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>('GET', endpoint, undefined, config),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('POST', endpoint, body, config),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PUT', endpoint, body, config),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', endpoint, body, config),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>('DELETE', endpoint, undefined, config),
};

export { ApiClientError };
