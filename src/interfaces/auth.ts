export type TokenPayload = {
  id: string;
  email: string;
  role: string;
  sessionId: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
  rememberMe: boolean;
  sessionExpiresIn: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SessionFilterRequest = {
  userId?: string;
  searchTerm?: string;
};
