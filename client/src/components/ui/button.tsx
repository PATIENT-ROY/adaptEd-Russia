import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95":
              variant === "default",
            "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-600 active:scale-95":
              variant === "destructive",
            "border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-700 active:scale-95":
              variant === "outline",
            "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 shadow-sm hover:shadow-md hover:from-slate-200 hover:to-slate-300 active:scale-95":
              variant === "secondary",
            "text-slate-600 hover:text-blue-600 hover:bg-slate-100 active:scale-95":
              variant === "ghost",
            "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700":
              variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 py-1 text-xs": size === "sm",
            "h-12 px-8 py-3 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
