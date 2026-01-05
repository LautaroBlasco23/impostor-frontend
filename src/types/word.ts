export interface Word {
  id: number;
  text: string;
  category: string;
  language: string;
}

export interface CreateWordRequest {
  text: string;
  category: string;
  language: string;
}
