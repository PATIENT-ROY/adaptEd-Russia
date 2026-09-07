import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function SelectField({
  className,
  wrapperClassName,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        {...props}
        className={cn(
          "w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pe-10 ps-3 font-normal text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 [&::-ms-expand]:hidden",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
