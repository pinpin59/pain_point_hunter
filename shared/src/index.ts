// Schémas Zod + types inférés
export * from './schemas/auth.schema';
export * from './schemas/reddit.schema';

// Constantes
export * from './constants/subreddits';
export * from './constants/pain_keywords';

// Types utilitaires génériques (pas besoin de Zod ici)
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
