// ─── Common Types ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
    requestId: string;
    timestamp: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  cursor?: string;
}

export type Currency = 'MYR' | 'SGD' | 'THB' | 'IDR' | 'PHP' | 'VND';

export type Locale = 'en' | 'ms' | 'zh-CN' | 'zh-TW' | 'th' | 'id' | 'vi' | 'tl';

export interface TenantContext {
  tenantId: string;
  branchId?: string;
  userId: string;
  role: string;
  permissions: string[];
}
