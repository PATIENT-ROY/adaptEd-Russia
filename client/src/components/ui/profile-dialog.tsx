"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/** Shared focus and viewport handling for the profile's controlled dialogs. */
export function ProfileDialog({
  open, onClose, title, children, className, overlayClassName,
  closeOnOutside = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnOutside?: boolean;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:p-4", overlayClassName)}>
          <Dialog.Content
            ref={contentRef}
            aria-describedby={undefined}
            className={cn("relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl outline-none sm:max-h-[calc(100dvh-2rem)]", className)}
            onOpenAutoFocus={(event) => {
              previousFocus.current = document.activeElement as HTMLElement | null;
              event.preventDefault();
              // Focus an action rather than opening a mobile keyboard immediately.
              (contentRef.current?.querySelector<HTMLElement>("button:not([disabled])") ?? contentRef.current)?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (previousFocus.current?.isConnected) previousFocus.current.focus();
            }}
            onPointerDownOutside={(event) => { if (!closeOnOutside) event.preventDefault(); }}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
