export interface CompanyDetail {
  deleted?: boolean;
  id: string;
  title: string;
  timestamp: number;
  apiData?: Record<string, unknown>;
}

export interface UpdateCompanyData {
  deleted?: boolean;
  title?: string;
  apiData?: Record<string, unknown>;
}
