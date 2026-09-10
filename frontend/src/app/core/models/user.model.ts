export interface User {
  id: number;
  username: string;
  fullName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
