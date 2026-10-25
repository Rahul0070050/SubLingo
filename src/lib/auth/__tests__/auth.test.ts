import { describe, it, expect, beforeEach } from "vitest";
import {
  issueOtp,
  verifyOtpAndCreatePasskey,
  validateMasterPasskey,
  isValidGmail,
  isValidCommonEmail,
  validateEmailInput,
  generateMasterPasskey,
  normalizeEmail,
} from "../store";

describe("Passwordless Authentication & Master Passkey System", () => {
  const testEmail = "developer.test@gmail.com";

  it("validates common trusted email providers and rejects temporary/disposable emails", () => {
    // Valid common email providers
    expect(isValidCommonEmail("test@gmail.com")).toBe(true);
    expect(isValidCommonEmail("user.name+tag@gmail.com")).toBe(true);
    expect(isValidCommonEmail("user@googlemail.com")).toBe(true);
    expect(isValidCommonEmail("someone@outlook.com")).toBe(true);
    expect(isValidCommonEmail("someone@hotmail.com")).toBe(true);
    expect(isValidCommonEmail("someone@live.com")).toBe(true);
    expect(isValidCommonEmail("someone@msn.com")).toBe(true);
    expect(isValidCommonEmail("someone@yahoo.com")).toBe(true);
    expect(isValidCommonEmail("user@icloud.com")).toBe(true);
    expect(isValidCommonEmail("user@me.com")).toBe(true);
    expect(isValidCommonEmail("user@proton.me")).toBe(true);
    expect(isValidCommonEmail("user@protonmail.com")).toBe(true);
    expect(isValidCommonEmail("user@zoho.com")).toBe(true);
    expect(isValidCommonEmail("user@aol.com")).toBe(true);

    // Invalid email syntax
    expect(isValidCommonEmail("invalid-email")).toBe(false);
    expect(isValidCommonEmail("")).toBe(false);

    // Rejected temporary / disposable / unknown domains
    expect(isValidCommonEmail("fake@tempmail.com")).toBe(false);
    expect(isValidCommonEmail("trash@mailinator.com")).toBe(false);
    expect(isValidCommonEmail("test@10minutemail.com")).toBe(false);
    expect(isValidCommonEmail("random@yopmail.com")).toBe(false);
    expect(isValidCommonEmail("user@guerrillamail.com")).toBe(false);
    expect(isValidCommonEmail("burner@dispostable.com")).toBe(false);
    expect(isValidCommonEmail("user@throwaway.xyz")).toBe(false);

    // validateEmailInput helper feedback
    expect(validateEmailInput("test@gmail.com").valid).toBe(true);
    expect(validateEmailInput("spammer@tempmail.com").valid).toBe(false);
    expect(validateEmailInput("spammer@tempmail.com").message).toContain("Please use a common email provider");
  });

  it("generates a unique master passkey with the proper format", () => {
    const key1 = generateMasterPasskey();
    const key2 = generateMasterPasskey();

    expect(key1).toMatch(/^SL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(key2).toMatch(/^SL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(key1).not.toBe(key2);
  });

  it("issues a 6-digit numeric OTP and enforces verification", async () => {
    const issueRes = await issueOtp("auth.test1@gmail.com");
    expect(issueRes.success).toBe(true);
    expect(issueRes.otp).toBeDefined();
    expect(issueRes.otp).toMatch(/^\d{6}$/);

    // Incorrect code fails
    const badVerify = await verifyOtpAndCreatePasskey("auth.test1@gmail.com", "000000");
    expect(badVerify.success).toBe(false);

    // Correct code succeeds and creates 24-hour master passkey
    const goodVerify = await verifyOtpAndCreatePasskey("auth.test1@gmail.com", issueRes.otp!);
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

  it("allows login using the 24-hour master passkey", async () => {
    const issueRes = await issueOtp("auth.test2@gmail.com");
    const verifyRes = await verifyOtpAndCreatePasskey("auth.test2@gmail.com", issueRes.otp!);
    const passkey = verifyRes.passkey!;

    // Validate login with passkey
    const loginRes = await validateMasterPasskey(passkey);
    expect(loginRes.valid).toBe(true);
    expect(loginRes.user).toBeDefined();
    expect(loginRes.user!.email).toBe("auth.test2@gmail.com");
    expect(loginRes.user!.passkey).toBe(passkey);

    // Reject invalid passkey
    const badLogin = await validateMasterPasskey("SL-FAKE-PASS-KEY9-9999");
    expect(badLogin.valid).toBe(false);
    expect(badLogin.expired).toBeFalsy();
  });
});
