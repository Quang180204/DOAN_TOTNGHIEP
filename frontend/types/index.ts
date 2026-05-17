// types/index.ts

export interface Account {
  account_id: number;
  Name: string | null;
  email: string | null;
  Phone: string | null;
  Avatar: string | null;
  Role: number;           // 0: admin, 1: user, 2: editor
  status: string | null;  // '1': active, '0': deleted
  create_at: string;
  update_at: string;
  create_by: string | null;
  update_by: string | null;
  addresses?: AccountAddress[];
}

export interface AccountAddress {
  account_address_id: number;
  account_id: number;
  province_id: number;
  district_id: number;
  ward_id: number;
  accountPhoneNumber: string | null;
  accountUsername: string | null;
  content: string | null;
  isDefault: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
  trashCount?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  trashCount?: number;
}