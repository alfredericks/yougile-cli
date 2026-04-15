export interface PagingMetadata {
  count: number;
  limit: number;
  offset: number;
  next: boolean;
}

export interface ApiListResponse<T> {
  paging: PagingMetadata;
  content: T[];
}

export interface WithIdResponse {
  id: string;
}

export interface ListFilters {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
