import { NextRequest, NextResponse } from "next/server";
import { issueOtp } from "@/lib/auth/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Please provide a valid Gmail address." },
        { status: 400 }
      );
    }

    const result = await issueOtp(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // In a live production environment, this OTP is emailed.
    // For local development and demonstration, we also return previewOtp so the user can test without setting up external SMTP.
    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}. Valid for 10 minutes.`,
      previewOtp: result.otp,
      expiresInSeconds: result.expiresInSeconds,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
