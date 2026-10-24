import crypto from "crypto";
import fs from "fs";
import path from "path";
import { OtpRecord, PasskeyRecord, UserSession } from "./types";
import { sendOtpEmail } from "../email/resend";
import { getDb } from "../db/mongodb";

const PASSKEY_DURATION_MS = 24 * 60 * 60 * 1000; // Exactly 24 Hours
const OTP_DURATION_MS = 10 * 60 * 1000; // 10 Minutes
const RATE_LIMIT_COOLDOWN_MS = 20 * 1000; // 20 Seconds cooldown

const STORE_FILE_PATH = path.join(process.cwd(), ".auth_store.json");

// In-memory caches for fast fallback lookups
const memoryOtps = new Map<string, OtpRecord>();
const memoryPasskeys = new Map<string, PasskeyRecord>();

// Hydrate from file if available
function loadStoreFromFile() {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE_PATH, "utf-8"));
      if (Array.isArray(data.passkeys)) {
        for (const item of data.passkeys) {
          if (item && item.passkey) {
            memoryPasskeys.set(item.passkey, item);
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
      passkeys: Array.from(memoryPasskeys.values()),
      updatedAt: Date.now(),
    };
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist auth store file:", err);
  }
}

// Initial file load for fallback
loadStoreFromFile();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidGmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;
  return normalized.endsWith("@gmail.com") || normalized.includes("@");
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateMasterPasskey(): string {
  const bytes = crypto.randomBytes(8).toString("hex").toUpperCase();
  const chunk1 = bytes.slice(0, 4);
  const chunk2 = bytes.slice(4, 8);
  const chunk3 = bytes.slice(8, 12);
  const chunk4 = bytes.slice(12, 16);
  return `SL-${chunk1}-${chunk2}-${chunk3}-${chunk4}`;
}

/**
 * Issues an OTP for a Gmail address and sends via Resend email service
 */
export async function issueOtp(email: string): Promise<{
  success: boolean;
  otp?: string;
  message?: string;
  expiresInSeconds?: number;
  emailSent?: boolean;
}> {
  const cleanEmail = normalizeEmail(email);
  if (!isValidGmail(cleanEmail)) {
    return {
      success: false,
      message: "Please enter a valid Gmail address (e.g. yourname@gmail.com).",
    };
  }

  const now = Date.now();
  const db = await getDb();

  // Rate limiting check
  let existing: OtpRecord | null = memoryOtps.get(cleanEmail) || null;
  if (db) {
    const doc = await db.collection("otps").findOne({ email: cleanEmail });
    if (doc) {
      existing = {
        email: doc.email,
        otp: doc.otp,
        expiresAt: new Date(doc.expiresAt).getTime(),
        attempts: doc.attempts || 0,
        lastRequestedAt: doc.lastRequestedAt ? new Date(doc.lastRequestedAt).getTime() : 0,
      };
    }
  }

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
  const expiresAt = now + OTP_DURATION_MS;

  const record: OtpRecord = {
    email: cleanEmail,
    otp: code,
    expiresAt,
    attempts: 0,
    lastRequestedAt: now,
  };

  // 1. Store in MongoDB if available
  if (db) {
    try {
      await db.collection("otps").updateOne(
        { email: cleanEmail },
        {
          $set: {
            email: cleanEmail,
            otp: code,
            expiresAt: new Date(expiresAt),
            attempts: 0,
            lastRequestedAt: new Date(now),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.warn("[MONGODB] Failed to save OTP, using memory fallback:", err);
    }
  }

  // 2. Always keep in local memory
  memoryOtps.set(cleanEmail, record);

  // 3. Dispatch Email via Resend
  const emailResult = await sendOtpEmail({
    to: cleanEmail,
    otp: code,
    expiresInMinutes: 10,
  });

  return {
    success: true,
    otp: code,
    expiresInSeconds: Math.floor(OTP_DURATION_MS / 1000),
    emailSent: emailResult.success,
  };
}

/**
 * Verifies an OTP and creates a unique 24-hour master passkey in MongoDB
 */
export async function verifyOtpAndCreatePasskey(
  email: string,
  providedOtp: string
): Promise<{
  success: boolean;
  message?: string;
  passkey?: string;
  user?: UserSession;
}> {
  const cleanEmail = normalizeEmail(email);
  const cleanOtp = providedOtp.trim();
  const now = Date.now();
  const db = await getDb();

  let record: OtpRecord | null = memoryOtps.get(cleanEmail) || null;

  // Query MongoDB if available
  if (db) {
    try {
      const doc = await db.collection("otps").findOne({ email: cleanEmail });
      if (doc) {
        record = {
          email: doc.email,
          otp: doc.otp,
          expiresAt: new Date(doc.expiresAt).getTime(),
          attempts: doc.attempts || 0,
          lastRequestedAt: doc.lastRequestedAt ? new Date(doc.lastRequestedAt).getTime() : 0,
        };
      }
    } catch (err) {
      console.warn("[MONGODB] Failed to read OTP, using memory fallback:", err);
    }
  }

  if (!record) {
    return {
      success: false,
      message: "No active verification request found. Please request an OTP first.",
    };
  }

  if (now > record.expiresAt) {
    if (db) await db.collection("otps").deleteOne({ email: cleanEmail }).catch(() => {});
    memoryOtps.delete(cleanEmail);
    return {
      success: false,
      message: "The OTP has expired. Please request a new verification code.",
    };
  }

  if (record.attempts >= 5) {
    if (db) await db.collection("otps").deleteOne({ email: cleanEmail }).catch(() => {});
    memoryOtps.delete(cleanEmail);
    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  if (record.otp !== cleanOtp) {
    record.attempts += 1;
    if (db) {
      await db.collection("otps").updateOne(
        { email: cleanEmail },
        { $inc: { attempts: 1 } }
      ).catch(() => {});
    }
    return {
      success: false,
      message: "Incorrect verification code. Please check and try again.",
    };
  }

  // OTP verified successfully - revoke used OTP
  if (db) await db.collection("otps").deleteOne({ email: cleanEmail }).catch(() => {});
  memoryOtps.delete(cleanEmail);

  // Invalidate any older passkey for this email so each user has one active passkey
  if (db) {
    await db.collection("passkeys").deleteMany({ email: cleanEmail }).catch(() => {});
  }
  for (const [key, item] of memoryPasskeys.entries()) {
    if (item.email === cleanEmail) {
      memoryPasskeys.delete(key);
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

  // Persist to MongoDB
  if (db) {
    try {
      await db.collection("passkeys").insertOne({
        passkey,
        email: cleanEmail,
        createdAt: new Date(now),
        expiresAt: new Date(expiresAt),
        lastUsedAt: new Date(now),
      });
    } catch (err) {
      console.warn("[MONGODB] Failed to insert passkey, using memory fallback:", err);
    }
  }

  // Also persist in local cache/file
  memoryPasskeys.set(passkey, passkeyRecord);
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
export async function validateMasterPasskey(passkeyInput: string): Promise<{
  valid: boolean;
  expired?: boolean;
  message?: string;
  user?: UserSession;
}> {
  const cleanPasskey = passkeyInput.trim().toUpperCase();
  const now = Date.now();
  const db = await getDb();

  let record: PasskeyRecord | null = memoryPasskeys.get(cleanPasskey) || null;

  if (db) {
    try {
      const doc = await db.collection("passkeys").findOne({ passkey: cleanPasskey });
      if (doc) {
        record = {
          passkey: doc.passkey,
          email: doc.email,
          createdAt: new Date(doc.createdAt).getTime(),
          expiresAt: new Date(doc.expiresAt).getTime(),
          lastUsedAt: doc.lastUsedAt ? new Date(doc.lastUsedAt).getTime() : now,
        };
      }
    } catch (err) {
      console.warn("[MONGODB] Failed to query passkey, using memory fallback:", err);
    }
  }

  if (!record) {
    return {
      valid: false,
      message: "Invalid master passkey. Please check your key or verify with a new Gmail OTP.",
    };
  }

  // Check 24-hour expiration
  if (now > record.expiresAt) {
    if (db) await db.collection("passkeys").deleteOne({ passkey: cleanPasskey }).catch(() => {});
    memoryPasskeys.delete(cleanPasskey);
    persistStoreToFile();
    return {
      valid: false,
      expired: true,
      message: "This master passkey has expired after 24 hours. Please verify with a new Gmail OTP.",
    };
  }

  // Update last used timestamp
  record.lastUsedAt = now;
  if (db) {
    await db.collection("passkeys").updateOne(
      { passkey: cleanPasskey },
      { $set: { lastUsedAt: new Date(now) } }
    ).catch(() => {});
  }
  persistStoreToFile();

  const user = formatUserSession(record);

  return {
    valid: true,
    user,
  };
}

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

export async function getActiveSession(passkeyInput?: string | null): Promise<UserSession | null> {
  if (!passkeyInput) return null;
  const res = await validateMasterPasskey(passkeyInput);
  return res.valid && res.user ? res.user : null;
}

export async function revokePasskey(passkeyInput: string): Promise<void> {
  const clean = passkeyInput.trim().toUpperCase();
  const db = await getDb();
  if (db) {
    await db.collection("passkeys").deleteOne({ passkey: clean }).catch(() => {});
  }
  memoryPasskeys.delete(clean);
  persistStoreToFile();
}
