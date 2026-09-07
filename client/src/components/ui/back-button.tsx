"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLastInAppPath } from "@/components/layout/remember-path";

interface BackButtonProps {
  label: string;
  className?: string;
  onClick?: () => void;
  href?: string;
  fallbackHref?: string;
}

const backButtonClassName =
  "inline-flex h-8 w-fit items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium leading-none text-slate-700 sm:h-9 sm:px-3 sm:text-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900";

function goTo(url: string) {
  if (typeof window === "undefined") return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (url === window.location.pathname || url === current) return;
  window.location.assign(url);
}

export function BackButton({
  label,
  className,
  onClick,
  href,
  fallbackHref = "/",
}: BackButtonProps) {
  const classes = cn(backButtonClassName, className);
  const inner = (
    <>
      <ArrowLeft className="block size-3.5 shrink-0 sm:size-4 rtl:rotate-180" aria-hidden />
      <span className="leading-none">{label}</span>
    </>
  );

  return (
    <button
      type="button"
      onClick={
        onClick ??
        (() => {
          goTo(getLastInAppPath() ?? href ?? fallbackHref);
        })
      }
      className={classes}
    >
      {inner}
    </button>
  );
}
