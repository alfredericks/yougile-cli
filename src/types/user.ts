export interface User {
  id: string;
  email: string;
  isAdmin?: boolean;
  realName: string;
  status: string;
  lastActivity: number;
}

export interface CreateUserData {
  email: string;
  isAdmin?: boolean;
}

export interface UpdateUserData {
  isAdmin?: boolean;
}
