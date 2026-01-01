import { apiClient } from './client';
import type { Word, CreateWordRequest } from '../types';

const BASE_PATH = '/words';

export const wordService = {
  create: (request: CreateWordRequest): Promise<Word> =>
    apiClient.post<Word>(BASE_PATH, request),

  get: (id: number): Promise<Word> =>
    apiClient.get<Word>(`${BASE_PATH}/${id}`),

  getByCategory: (category: string): Promise<Word[]> =>
    apiClient.get<Word[]>(`${BASE_PATH}/category/${category}`),

  getRandom: (category: string, limit = 10): Promise<Word[]> =>
    apiClient.get<Word[]>(`${BASE_PATH}/category/${category}/random?limit=${limit}`),

  getAll: (): Promise<Word[]> =>
    apiClient.get<Word[]>(BASE_PATH),

  delete: (id: number): Promise<void> =>
    apiClient.delete<void>(`${BASE_PATH}/${id}`),
};
