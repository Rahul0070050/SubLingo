import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5",
      outline: "border border-border/80 bg-background/50 hover:bg-accent/10 hover:text-accent-foreground backdrop-blur-sm",
      ghost: "hover:bg-accent/10 hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold hover:brightness-110 shadow-lg shadow-indigo-500/25",
    };

    const sizes = {
      default: "h-10 px-4 py-2 rounded-xl text-sm",
      sm: "h-8 px-3 rounded-lg text-xs",
      lg: "h-12 px-6 rounded-xl text-base",
      icon: "h-9 w-9 rounded-xl",
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
