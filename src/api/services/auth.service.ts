import { BaseClient } from '../base-client.js';
import type {
  AuthCredentials,
  AuthCredentialsWithCompanyOptional,
  AuthCredentialsWithCompany,
  Company,
  AuthKeyWithDetails,
  ApiListResponse,
} from '../../types/index.js';

export class AuthService extends BaseClient {
  async getCompanies(
    credentials: AuthCredentials & { name?: string },
  ): Promise<ApiListResponse<Company>> {
    return this.postUnauth<AuthCredentials & { name?: string }, ApiListResponse<Company>>(
      'auth/companies',
      credentials,
    );
  }

  async listKeys(
    credentials: AuthCredentialsWithCompanyOptional,
  ): Promise<ApiListResponse<AuthKeyWithDetails>> {
    return this.postUnauth<AuthCredentialsWithCompanyOptional, ApiListResponse<AuthKeyWithDetails>>(
      'auth/keys/get',
      credentials,
    );
  }

  async createKey(
    credentials: AuthCredentialsWithCompany,
  ): Promise<{ key: string }> {
    return this.postUnauth<AuthCredentialsWithCompany, { key: string }>(
      'auth/keys',
      credentials,
    );
  }

  async deleteKey(key: string): Promise<void> {
    return this.del(`auth/keys/${key}`);
  }
}
