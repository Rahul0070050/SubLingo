import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "SubLingo <onboarding@resend.dev>";

// Lazy initialization
let resendClient: Resend | null = null;
if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  expiresInMinutes?: number;
}

export async function sendOtpEmail({
  to,
  otp,
  expiresInMinutes = 10,
}: SendOtpEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}> {
  // If no RESEND_API_KEY is configured, simulate dispatch and log to console
  if (!resendApiKey || !resendClient) {
    console.log(
      `[RESEND SIMULATION] 📧 To: ${to} | Verification OTP: ${otp} | (Set RESEND_API_KEY in .env.local to send live emails)`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: resendFromEmail,
      to: [to],
      subject: `Your SubLingo Verification Code: ${otp}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SubLingo Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0f14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 520px;
      margin: 40px auto;
      background-color: #141923;
      border: 1px solid #1e2638;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.5;
    }
    .code-box {
      margin: 28px 0;
      background: #090c10;
      border: 1px solid #252f44;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
    }
    .code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #38bdf8;
      margin: 0;
    }
    .expiry {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 10px;
    }
    .info-card {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      line-height: 1.5;
      color: #cbd5e1;
    }
    .info-title {
      font-weight: 600;
      color: #93c5fd;
      margin-bottom: 4px;
    }
    .footer {
      border-top: 1px solid #1e2638;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Passwordless Verification</div>
      <h1 class="title">Verify Your Gmail</h1>
      <p class="subtitle">Enter the verification code below to generate your 24-hour master passkey for SubLingo Studio.</p>
    </div>

    <div class="code-box">
      <div class="code">${otp}</div>
      <div class="expiry">Expires in ${expiresInMinutes} minutes • Do not share this code</div>
    </div>

    <div class="info-card">
      <div class="info-title">🔑 What happens next?</div>
      Once verified, you will receive a <strong>24-Hour Master Passkey</strong>. You can use that single passkey to sign in instantly across your devices without waiting for emails.
    </div>

    <div class="footer">
      If you did not request this code, you can safely ignore this email.<br>
      © ${new Date().getFullYear()} SubLingo Subtitle Studio. All rights reserved.
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    console.error("Failed to send email via Resend:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Email dispatch failed",
    };
  }
}
