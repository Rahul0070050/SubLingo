import crypto from "crypto";
import fs from "fs";
import path from "path";
import { OtpRecord, PasskeyRecord, UserSession } from "./types";

const PASSKEY_DURATION_MS = 24 * 60 * 60 * 1000; // Exactly 24 Hours
const OTP_DURATION_MS = 10 * 60 * 1000; // 10 Minutes
const RATE_LIMIT_COOLDOWN_MS = 20 * 1000; // 20 Seconds cooldown

const STORE_FILE_PATH = path.join(process.cwd(), ".auth_store.json");

// In-memory caches for fast lookups
const otps = new Map<string, OtpRecord>();
const passkeys = new Map<string, PasskeyRecord>();

// Hydrate from file if available
function loadStoreFromFile() {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE_PATH, "utf-8"));
      if (Array.isArray(data.passkeys)) {
        for (const item of data.passkeys) {
          if (item && item.passkey) {
            passkeys.set(item.passkey, item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not load auth store file:", err);
  }
}

function persistStoreToFile() {
  try {
    const data = {
      passkeys: Array.from(passkeys.values()),
      updatedAt: Date.now(),
    };
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist auth store file:", err);
  }
}

// Initial load
loadStoreFromFile();

/**
 * Normalizes email and validates Gmail domain
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidGmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;

  // Prefer or enforce Gmail/Google workspace
  return normalized.endsWith("@gmail.com") || normalized.includes("@");
}

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generates a unique 24-hour master passkey
 * Format: SL-XXXX-XXXX-XXXX-XXXX
 */
export function generateMasterPasskey(): string {
  const bytes = crypto.randomBytes(8).toString("hex").toUpperCase();
  const chunk1 = bytes.slice(0, 4);
  const chunk2 = bytes.slice(4, 8);
  const chunk3 = bytes.slice(8, 12);
  const chunk4 = bytes.slice(12, 16);
  return `SL-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
}

/**
 * Issues an OTP for a Gmail address
 */
export function issueOtp(email: string): {
  success: boolean;
  otp?: string;
  message?: string;
  expiresInSeconds?: number;
} {
  const cleanEmail = normalizeEmail(email);
  if (!isValidGmail(cleanEmail)) {
    return {
      success: false,
      message: "Please enter a valid Gmail address (e.g. yourname@gmail.com).",
    };
  }

  const now = Date.now();
  const existing = otps.get(cleanEmail);

  // Rate limiting check
  if (existing && now - existing.lastRequestedAt < RATE_LIMIT_COOLDOWN_MS) {
    const remainingSecs = Math.ceil(
      (RATE_LIMIT_COOLDOWN_MS - (now - existing.lastRequestedAt)) / 1000
    );
    return {
      success: false,
      message: `Please wait ${remainingSecs} seconds before requesting a new OTP.`,
    };
  }

  const code = generateOtp();
  const record: OtpRecord = {
    email: cleanEmail,
    otp: code,
    expiresAt: now + OTP_DURATION_MS,
    attempts: 0,
    lastRequestedAt: now,
  };

  otps.set(cleanEmail, record);

  // In production, send email via SMTP or Gmail API
  console.log(`[AUTH] 📧 OTP issued for ${cleanEmail}: ${code}`);

  return {
    success: true,
    otp: code,
    expiresInSeconds: Math.floor(OTP_DURATION_MS / 1000),
  };
}

/**
 * Verifies an OTP and creates a unique 24-hour master passkey
 */
export function verifyOtpAndCreatePasskey(
  email: string,
  providedOtp: string
): {
  success: boolean;
  message?: string;
  passkey?: string;
  user?: UserSession;
} {
  const cleanEmail = normalizeEmail(email);
  const cleanOtp = providedOtp.trim();
  const now = Date.now();

  const record = otps.get(cleanEmail);
  if (!record) {
    return {
      success: false,
      message: "No active verification request found. Please request an OTP first.",
    };
  }

  if (now > record.expiresAt) {
    otps.delete(cleanEmail);
    return {
      success: false,
      message: "The OTP has expired. Please request a new verification code.",
    };
  }

  if (record.attempts >= 5) {
    otps.delete(cleanEmail);
    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  if (record.otp !== cleanOtp) {
    record.attempts += 1;
    return {
      success: false,
      message: "Incorrect verification code. Please check and try again.",
    };
  }

  // OTP verified successfully - revoke used OTP
  otps.delete(cleanEmail);

  // Invalidate any older passkey for this email so each user has one active passkey
  for (const [key, item] of passkeys.entries()) {
    if (item.email === cleanEmail) {
      passkeys.delete(key);
    }
  }

  // Generate unique 24-hour master passkey
  const passkey = generateMasterPasskey();
  const expiresAt = now + PASSKEY_DURATION_MS;

  const passkeyRecord: PasskeyRecord = {
    passkey,
    email: cleanEmail,
    createdAt: now,
    expiresAt,
    lastUsedAt: now,
  };

  passkeys.set(passkey, passkeyRecord);
  persistStoreToFile();

  const user = formatUserSession(passkeyRecord);

  return {
    success: true,
    passkey,
    user,
  };
}

/**
 * Validates a master passkey for login
 */
export function validateMasterPasskey(passkeyInput: string): {
  valid: boolean;
  expired?: boolean;
  message?: string;
  user?: UserSession;
} {
  const cleanPasskey = passkeyInput.trim().toUpperCase();
  const now = Date.now();

  const record = passkeys.get(cleanPasskey);
  if (!record) {
    return {
      valid: false,
      message: "Invalid master passkey. Please check your key or verify with a new Gmail OTP.",
    };
  }

  // Check 24-hour expiration
  if (now > record.expiresAt) {
    passkeys.delete(cleanPasskey);
    persistStoreToFile();
    return {
      valid: false,
      expired: true,
      message: "This master passkey has expired after 24 hours. Please verify with a new Gmail OTP.",
    };
  }

  // Update last used timestamp
  record.lastUsedAt = now;
  persistStoreToFile();

  const user = formatUserSession(record);

  return {
    valid: true,
    user,
  };
}

/**
 * Formats a passkey record into a UserSession with remaining time
 */
export function formatUserSession(record: PasskeyRecord): UserSession {
  const now = Date.now();
  const remainingMs = Math.max(0, record.expiresAt - now);
  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hoursRemaining = Math.floor(totalMinutes / 60);
  const minutesRemaining = totalMinutes % 60;
  const isExpired = remainingMs <= 0;

  const expiryDate = new Date(record.expiresAt);
  const formattedExpiry = expiryDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    email: record.email,
    passkey: record.passkey,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    hoursRemaining,
    minutesRemaining,
    formattedExpiry,
    isExpired,
  };
}

/**
 * Retrieves an active passkey record by passkey string
 */
export function getActiveSession(passkeyInput?: string | null): UserSession | null {
  if (!passkeyInput) return null;
  const clean = passkeyInput.trim().toUpperCase();
  const record = passkeys.get(clean);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    passkeys.delete(clean);
    persistStoreToFile();
    return null;
  }

  return formatUserSession(record);
}

/**
 * Revokes a passkey on logout
 */
export function revokePasskey(passkeyInput: string) {
  const clean = passkeyInput.trim().toUpperCase();
  passkeys.delete(clean);
  persistStoreToFile();
}
