"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function BackButton({ label, className, onClick, href }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick ?? (() => href ? router.push(href) : router.back())}
      className={cn(
        "h-8 min-h-0 w-fit gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-0 text-xs font-medium leading-none text-slate-700 shadow-none",
        "sm:h-9 sm:gap-1.5 sm:px-3 sm:text-sm",
        "hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:shadow-none",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
      {label}
    </Button>
  );
}
