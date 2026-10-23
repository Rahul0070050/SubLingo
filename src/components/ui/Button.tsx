import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-500 shadow-sm hover:shadow-blue-500/15 border border-blue-500/30",
      secondary:
        "bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-white/5",
      outline:
        "border border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06] hover:text-white hover:border-white/15",
      ghost:
        "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]",
      destructive:
        "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
      gradient:
        "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20 border border-blue-400/20 font-medium",
    };

    const sizes = {
      default: "h-9 px-4 py-2 rounded-lg text-sm",
      sm: "h-8 px-3 rounded-md text-xs",
      lg: "h-11 px-6 rounded-lg text-sm tracking-wide",
      icon: "h-9 w-9 rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
