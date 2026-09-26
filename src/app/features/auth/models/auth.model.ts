import type { User, LoginDto, LoginResponse } from '@core/models/auth.models';

export type AuthUser = User;
export type LoginCredentials = LoginDto;
export type { LoginResponse } from '@core/models/auth.models';

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}
