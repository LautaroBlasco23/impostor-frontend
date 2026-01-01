import { apiClient } from './client';
import type { Game, StartGameRequest, VoteRequest, VoteResult, ApiMessage } from '../types';

const BASE_PATH = '/games';

export const gameService = {
  start: (request: StartGameRequest): Promise<Game> =>
    apiClient.post<Game>(`${BASE_PATH}/start`, request),

  get: (id: string): Promise<Game> =>
    apiClient.get<Game>(`${BASE_PATH}/${id}`),

  getByRoom: (roomId: string): Promise<Game> =>
    apiClient.get<Game>(`${BASE_PATH}/room/${roomId}`),

  vote: (request: VoteRequest): Promise<VoteResult> =>
    apiClient.post<VoteResult>(`${BASE_PATH}/vote`, request),

  end: (id: string): Promise<ApiMessage> =>
    apiClient.post<ApiMessage>(`${BASE_PATH}/${id}/end`),
};
