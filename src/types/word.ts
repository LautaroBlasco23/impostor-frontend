export interface Word {
  id: number;
  text: string;
  category: string;
}

export interface CreateWordRequest {
  text: string;
  category: string;
}
