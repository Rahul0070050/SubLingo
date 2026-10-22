import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "gradient";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/15 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-white/5",
    outline: "text-foreground border-border",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    destructive: "bg-red-500/15 text-red-400 border-red-500/25",
    gradient: "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
