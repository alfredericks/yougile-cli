import { BaseClient } from '../base-client.js';
import type {
  CompanyDetail,
  UpdateCompanyData,
  WithIdResponse,
} from '../../types/index.js';

export class CompanyService extends BaseClient {
  async get(): Promise<CompanyDetail> {
    return this.getById<CompanyDetail>('companies');
  }

  async update(data: UpdateCompanyData): Promise<WithIdResponse> {
    return this.put<UpdateCompanyData, WithIdResponse>('companies', data);
  }
}
