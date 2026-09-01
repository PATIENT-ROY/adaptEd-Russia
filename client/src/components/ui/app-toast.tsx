"use client";

import { CheckCircle, X } from "lucide-react";

type AppToastProps = {
  message: string;
  onClose: () => void;
  variant?: "success" | "error";
};

export function AppToast({
  message,
  onClose,
  variant = "success",
}: AppToastProps) {
  const isError = variant === "error";

  return (
    <div
      role="status"
      className={`fixed top-20 left-[50vw] z-[110] flex w-[calc(100vw-1.25rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-2xl animate-in slide-in-from-top-4 duration-300 ${
        isError ? "bg-red-600 text-white" : "bg-slate-900 text-white"
      }`}
    >
      {isError ? (
        <X className="h-4 w-4 flex-shrink-0 text-red-200" />
      ) : (
        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />
      )}
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="flex-shrink-0 text-white/60 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
