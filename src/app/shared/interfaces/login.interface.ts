export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginUser {
  id: string;
  fullName: string;
}

export interface LoginSuccessInterface {
  tokens: Tokens;
  user: LoginUser;
  accessSessionId: string;
}
