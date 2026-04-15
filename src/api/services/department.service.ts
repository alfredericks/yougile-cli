import { BaseClient } from '../base-client.js';
import type {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
  ApiListResponse,
  WithIdResponse,
} from '../../types/index.js';

export class DepartmentService extends BaseClient {
  async list(params?: {
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<Department>> {
    return this.getList<Department>('departments', params as Record<string, unknown>);
  }

  async get(id: string): Promise<Department> {
    return this.getById<Department>(`departments/${id}`);
  }

  async create(data: CreateDepartmentData): Promise<WithIdResponse> {
    return this.post<CreateDepartmentData, WithIdResponse>('departments', data);
  }

  async update(id: string, data: UpdateDepartmentData): Promise<WithIdResponse> {
    return this.put<UpdateDepartmentData, WithIdResponse>(`departments/${id}`, data);
  }
}
