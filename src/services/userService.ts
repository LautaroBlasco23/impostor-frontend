import { apiClient } from './client';
import type { User, CreateUserRequest } from '../types/user';
import { JoinRoomRequest } from '../types/room';
import { ApiMessage } from '../types/api';

const BASE_PATH = '/users';

export const userService = {
  create: (request: CreateUserRequest): Promise<User> => apiClient.post<User>(BASE_PATH, request),

  get: (id: string): Promise<User> => apiClient.get<User>(`${BASE_PATH}/${id}`),

  getByRoom: (roomId: string): Promise<User[]> =>
    apiClient.get<User[]>(`${BASE_PATH}/room/${roomId}`),

  joinRoom: (userId: string, request: JoinRoomRequest): Promise<ApiMessage> =>
    apiClient.post<ApiMessage>(`${BASE_PATH}/${userId}/join`, request),

  toggleReady: (userId: string): Promise<ApiMessage> =>
    apiClient.post<ApiMessage>(`${BASE_PATH}/${userId}/ready`),

  delete: (id: string): Promise<void> => apiClient.delete<void>(`${BASE_PATH}/${id}`),
};
