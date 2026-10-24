export interface PasskeyRecord {
  passkey: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
}

export interface OtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
}

export interface UserSession {
  email: string;
  passkey: string;
  createdAt: number;
  expiresAt: number;
  hoursRemaining: number;
  minutesRemaining: number;
  formattedExpiry: string;
  isExpired: boolean;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  previewOtp?: string; // Provided for quick developer/user testing
  expiresInSeconds?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  passkey?: string;
  expiresAt?: number;
  user?: UserSession;
}

export interface LoginPasskeyResponse {
  success: boolean;
  message?: string;
  expired?: boolean;
  user?: UserSession;
}
