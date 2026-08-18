"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
}

export function BackButton({ label, className, onClick }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick ?? (() => router.back())}
      className={cn(
        "h-9 w-fit rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-white hover:text-slate-900",
        className,
      )}
    >
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  );
}
