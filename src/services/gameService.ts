import type {
  Game,
  StartGameRequest,
  VoteRequest,
  VoteResult,
  LeaveGameRequest,
  ReturnToRoomRequest,
} from '../types/game';
import { apiClient } from './client';

const BASE_PATH = '/games';

export const gameService = {
  start: (request: StartGameRequest): Promise<Game> =>
    apiClient.post<Game>(`${BASE_PATH}/start`, request),
  get: (id: string): Promise<Game> => apiClient.get<Game>(`${BASE_PATH}/${id}`),
  getByRoom: (roomId: string): Promise<Game | null> =>
    apiClient.get<Game>(`${BASE_PATH}/room/${roomId}`).catch(() => null),
  vote: (request: VoteRequest): Promise<VoteResult> =>
    apiClient.post<VoteResult>(`${BASE_PATH}/vote`, request),
  end: (id: string): Promise<void> => apiClient.post<void>(`${BASE_PATH}/${id}/end`),
  leave: (gameId: string, request: LeaveGameRequest): Promise<void> =>
    apiClient.post<void>(`${BASE_PATH}/${gameId}/leave`, request),
  returnToRoom: (gameId: string, request: ReturnToRoomRequest): Promise<void> =>
    apiClient.post<void>(`${BASE_PATH}/${gameId}/return`, request),
};
