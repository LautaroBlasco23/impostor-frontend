import { apiClient } from './client';
import type { Room, CreateRoomRequest, SetCategoryRequest, ApiMessage } from '../types';

const BASE_PATH = '/rooms';

export const roomService = {
  create: (request: CreateRoomRequest): Promise<Room> =>
    apiClient.post<Room>(BASE_PATH, request),

  get: (id: string): Promise<Room> =>
    apiClient.get<Room>(`${BASE_PATH}/${id}`),

  getAll: (): Promise<Room[]> =>
    apiClient.get<Room[]>(BASE_PATH),

  setCategory: (roomId: string, request: SetCategoryRequest): Promise<ApiMessage> =>
    apiClient.put<ApiMessage>(`${BASE_PATH}/${roomId}/category`, request),

  delete: (id: string): Promise<void> =>
    apiClient.delete<void>(`${BASE_PATH}/${id}`),
};
