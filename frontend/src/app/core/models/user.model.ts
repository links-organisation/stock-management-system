export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'COMPTA';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  actorUserId: string;
  username: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface UpdateUserRequest {
  actorUserId: string;
  username?: string;
  password?: string;
  fullName?: string;
  role?: Role;
}

export interface SelfUpdateRequest {
  userId: string;
  username?: string;
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
}
