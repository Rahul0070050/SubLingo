"use client";

import * as React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  show(message: string, type: ToastType = "info", title?: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };
    toasts = [...toasts, item];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  warning(message: string, title?: string, duration?: number) {
    return toast.show(message, "warning", title, duration);
  },
  error(message: string, title?: string, duration?: number) {
    return toast.show(message, "error", title, duration);
  },
  success(message: string, title?: string, duration?: number) {
    return toast.show(message, "success", title, duration);
  },
  info(message: string, title?: string, duration?: number) {
    return toast.show(message, "info", title, duration);
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
  clear() {
    toasts = [];
    notify();
  },
};

export function useToast() {
  const [items, setItems] = React.useState<ToastItem[]>(toasts);

  React.useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return {
    toasts: items,
    toast,
    dismiss: toast.dismiss,
  };
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4 sm:p-0"
    >
      {toasts.map((item) => {
        const isWarning = item.type === "warning";
        const isError = item.type === "error";
        const isSuccess = item.type === "success";

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
              isWarning
                ? "border-amber-500/30 bg-[#161a22]/95 text-amber-200"
                : isError
                ? "border-red-500/30 bg-[#161a22]/95 text-rose-200"
                : isSuccess
                ? "border-emerald-500/30 bg-[#161a22]/95 text-emerald-200"
                : "border-blue-500/30 bg-[#161a22]/95 text-blue-200"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400" />}
              {isError && <AlertCircle className="h-4 w-4 text-rose-400" />}
              {isSuccess && <CheckCircle className="h-4 w-4 text-emerald-400" />}
              {!isWarning && !isError && !isSuccess && <Info className="h-4 w-4 text-blue-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {item.title && (
                <h5 className="text-xs font-semibold text-white mb-0.5">{item.title}</h5>
              )}
              <p className="text-xs text-slate-300 leading-snug break-words">{item.message}</p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

