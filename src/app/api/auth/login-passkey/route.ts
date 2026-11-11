import { NextRequest, NextResponse } from "next/server";
import { validateMasterPasskey } from "@/lib/auth/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey } = body;

    if (!passkey || typeof passkey !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter your master passkey." },
        { status: 400 }
      );
    }

    const result = await validateMasterPasskey(passkey);

    if (!result.valid || !result.user) {
      return NextResponse.json(
        {
          success: false,
          expired: result.expired || false,
          message:
            result.message ||
            "Invalid master passkey. Please check the code or verify with a new Gmail OTP.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully with 24-hour master passkey.",
      user: result.user,
    });

    // Calculate remaining seconds for cookie maxAge
    const remainingSeconds = Math.max(
      60,
      Math.floor((result.user.expiresAt - Date.now()) / 1000)
    );

    // Set secure session cookie
    response.cookies.set("subtivio_passkey", result.user.passkey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: remainingSeconds,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error logging in with passkey:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
