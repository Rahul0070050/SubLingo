import { NextRequest, NextResponse } from "next/server";
import { revokePasskey } from "@/lib/auth/store";

export async function POST(request: NextRequest) {
  try {
    const passkey = request.cookies.get("sublingo_passkey")?.value;
    if (passkey) {
      await revokePasskey(passkey);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.delete("sublingo_passkey");
    return response;
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}
