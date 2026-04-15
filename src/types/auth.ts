export interface AuthCredentials {
  login: string;
  password: string;
}

export interface AuthCredentialsWithName extends AuthCredentials {
  name?: string;
}

export interface AuthCredentialsWithCompany extends AuthCredentials {
  companyId: string;
}

export interface AuthCredentialsWithCompanyOptional extends AuthCredentials {
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthKeyWithDetails {
  key: string;
  companyId: string;
  timestamp: number;
  deleted: boolean;
}

export interface AuthKey {
  key: string;
}
