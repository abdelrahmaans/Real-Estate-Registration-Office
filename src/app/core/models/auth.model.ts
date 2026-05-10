// ============================================
// Authentication Models & Interfaces
// ============================================

import { UserProfile, UserRole } from '@models/common.model';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response with user profile and tokens
 */
export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Password reset request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface ConfirmPasswordReset {
  token: string;
  newPassword: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Session data
 */
export interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  expiresAt: number;
}
