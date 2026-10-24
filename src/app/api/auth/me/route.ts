import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth/store";

export async function GET(request: NextRequest) {
  try {
    // 1. Try cookie
    let passkey = request.cookies.get("sublingo_passkey")?.value;

    // 2. Try Authorization header
    if (!passkey) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        passkey = authHeader.substring(7).trim();
      }
    }

    if (!passkey) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const session = await getActiveSession(passkey);

    if (!session || session.isExpired) {
      const res = NextResponse.json({
        authenticated: false,
        expired: true,
        user: null,
      });
      res.cookies.delete("sublingo_passkey");
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    console.error("Error checking auth status:", error);
    return NextResponse.json(
      { authenticated: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
