import { NextRequest, NextResponse } from "next/server";
import { verifyOtpAndCreatePasskey } from "@/lib/auth/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const result = await verifyOtpAndCreatePasskey(email, otp);

    if (!result.success || !result.user || !result.passkey) {
      return NextResponse.json(
        { success: false, message: result.message || "Invalid OTP code." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Gmail verified successfully. 24-Hour Master Passkey generated.",
      passkey: result.passkey,
      expiresAt: result.user.expiresAt,
      user: result.user,
    });

    // Set secure session cookie valid for 24 hours (86,400 seconds)
    response.cookies.set("subtivio_passkey", result.passkey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
