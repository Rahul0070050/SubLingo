import { describe, it, expect, beforeEach } from "vitest";
import {
  issueOtp,
  verifyOtpAndCreatePasskey,
  validateMasterPasskey,
  isValidGmail,
  generateMasterPasskey,
  normalizeEmail,
} from "../store";

describe("Passwordless Authentication & Master Passkey System", () => {
  const testEmail = "developer.test@gmail.com";

  it("validates Gmail addresses correctly", () => {
    expect(isValidGmail("test@gmail.com")).toBe(true);
    expect(isValidGmail("user.name+tag@gmail.com")).toBe(true);
    expect(isValidGmail("invalid-email")).toBe(false);
    expect(isValidGmail("")).toBe(false);
  });

  it("generates a unique master passkey with the proper format", () => {
    const key1 = generateMasterPasskey();
    const key2 = generateMasterPasskey();

    expect(key1).toMatch(/^SL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(key2).toMatch(/^SL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(key1).not.toBe(key2);
  });

  it("issues a 6-digit numeric OTP and enforces verification", () => {
    const issueRes = issueOtp("auth.test1@gmail.com");
    expect(issueRes.success).toBe(true);
    expect(issueRes.otp).toBeDefined();
    expect(issueRes.otp).toMatch(/^\d{6}$/);

    // Incorrect code fails
    const badVerify = verifyOtpAndCreatePasskey("auth.test1@gmail.com", "000000");
    expect(badVerify.success).toBe(false);

    // Correct code succeeds and creates 24-hour master passkey
    const goodVerify = verifyOtpAndCreatePasskey("auth.test1@gmail.com", issueRes.otp!);
    expect(goodVerify.success).toBe(true);
    expect(goodVerify.passkey).toBeDefined();
    expect(goodVerify.user).toBeDefined();

    // Verify 24-hour duration
    const createdAt = goodVerify.user!.createdAt;
    const expiresAt = goodVerify.user!.expiresAt;
    const durationHours = (expiresAt - createdAt) / (60 * 60 * 1000);
    expect(durationHours).toBe(24);
    expect([23, 24]).toContain(goodVerify.user!.hoursRemaining);
    expect(goodVerify.user!.isExpired).toBe(false);
  });

  it("allows login using the 24-hour master passkey", () => {
    const issueRes = issueOtp("auth.test2@gmail.com");
    const verifyRes = verifyOtpAndCreatePasskey("auth.test2@gmail.com", issueRes.otp!);
    const passkey = verifyRes.passkey!;

    // Validate login with passkey
    const loginRes = validateMasterPasskey(passkey);
    expect(loginRes.valid).toBe(true);
    expect(loginRes.user).toBeDefined();
    expect(loginRes.user!.email).toBe("auth.test2@gmail.com");
    expect(loginRes.user!.passkey).toBe(passkey);

    // Reject invalid passkey
    const badLogin = validateMasterPasskey("SL-FAKE-PASS-KEY9-9999");
    expect(badLogin.valid).toBe(false);
    expect(badLogin.expired).toBeFalsy();
  });
});
