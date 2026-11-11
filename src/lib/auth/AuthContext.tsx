"use client";

import * as React from "react";
import { UserSession } from "./types";

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string; previewOtp?: string }>;
  verifyOtp: (
    email: string,
    otp: string
  ) => Promise<{ success: boolean; passkey?: string; user?: UserSession; message?: string }>;
  loginWithPasskey: (
    passkey: string
  ) => Promise<{ success: boolean; expired?: boolean; message?: string; user?: UserSession }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const refreshSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem("subtivio_user", JSON.stringify(data.user));
          return;
        }
      }
      setUser(null);
      localStorage.removeItem("subtivio_user");
    } catch (err) {
      console.warn("Failed to refresh auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial session check on mount
  React.useEffect(() => {
    // Fast initial optimistic load from localStorage
    try {
      const cached = localStorage.getItem("subtivio_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.expiresAt > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem("subtivio_user");
        }
      }
    } catch {
      // Ignore
    }

    refreshSession();
  }, [refreshSession]);

  const sendOtp = async (email: string) => {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: "Network connection error while sending OTP." };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem("subtivio_user", JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return { success: false, message: "Network error verifying OTP." };
    }
  };

  const loginWithPasskey = async (passkey: string) => {
    try {
      const res = await fetch("/api/auth/login-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem("subtivio_user", JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return { success: false, message: "Network error during passkey login." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("subtivio_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !user.isExpired,
        isLoading,
        sendOtp,
        verifyOtp,
        loginWithPasskey,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
