"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { LogOut, CheckCircle, X, Shield, User, Home, ArrowRight } from "lucide-react";

interface LogoutNotificationProps {
  userName: string;
  onClose: () => void;
  isVisible: boolean;
}

export function LogoutNotification({ userName, onClose, isVisible }: LogoutNotificationProps) {
  const [isClient, setIsClient] = useState(false);
  const closeRef = useRef(onClose);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isClient || !isVisible) return;
    // Parent renders must not restart the ten-second reading time.
    const timer = window.setTimeout(() => closeRef.current(), 10000);
    return () => window.clearTimeout(timer);
  }, [isVisible, isClient]);

  if (!isClient) return null;

  return (
    <Dialog.Root open={isVisible} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-3 backdrop-blur-md sm:p-4 motion-safe:animate-fade-in">
          <Dialog.Content
            asChild
            onOpenAutoFocus={() => { previousFocus.current = document.activeElement as HTMLElement | null; }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (previousFocus.current?.isConnected) previousFocus.current.focus();
              else document.querySelector<HTMLElement>("main a[href], main button, header a[href]")?.focus();
            }}
            onPointerDownOutside={(event) => event.preventDefault()}
          >
            <Card className="no-hover relative !m-0 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden border-0 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-2xl outline-none !transition-none sm:max-h-[calc(100dvh-2rem)]">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Закрыть уведомление" className="absolute end-2 top-2 z-10 h-11 w-11 rounded-full bg-white/90 p-0 hover:bg-slate-100">
                  <X className="h-5 w-5" aria-hidden />
                </Button>
              </Dialog.Close>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <CardHeader className="p-4 pb-3 text-center sm:p-6 sm:pb-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 shadow-lg sm:mb-6 sm:h-20 sm:w-20 sm:rounded-3xl">
                    <LogOut className="h-6 w-6 text-white sm:h-10 sm:w-10" aria-hidden />
                  </div>
                  <Dialog.Title asChild>
                    <CardTitle className="mb-2 text-2xl font-bold text-slate-900 sm:mb-3 sm:text-3xl">До свидания! 👋</CardTitle>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <CardDescription className="break-words text-sm text-slate-600 sm:text-lg">Вы успешно вышли из аккаунта, {userName}</CardDescription>
                  </Dialog.Description>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0 sm:space-y-6 sm:p-6 sm:pt-0">
                  <div className="text-center">
                    <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-xs text-green-800 sm:mb-4 sm:px-4 sm:text-base">
                      <CheckCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
                      <span className="font-medium">Выход выполнен успешно</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">Ваша сессия завершена. Все данные сохранены и будут доступны при следующем входе в систему.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-2 text-center sm:p-4">
                      <Shield className="mx-auto mb-2 h-5 w-5 text-blue-600 sm:h-8 sm:w-8" aria-hidden />
                      <p className="break-words text-xs font-medium text-blue-900 sm:text-sm">Сессия завершена</p>
                    </div>
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-2 text-center sm:p-4">
                      <CheckCircle className="mx-auto mb-2 h-5 w-5 text-green-600 sm:h-8 sm:w-8" aria-hidden />
                      <p className="break-words text-xs font-medium text-green-900 sm:text-sm">Данные сохранены</p>
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-2 text-center sm:p-4">
                      <User className="mx-auto mb-2 h-5 w-5 text-purple-600 sm:h-8 sm:w-8" aria-hidden />
                      <p className="break-words text-xs font-medium text-purple-900 sm:text-sm">Профиль защищен</p>
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="shrink-0 border-t border-slate-100 bg-white/90 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button onClick={() => (window.location.href = "/")} className="h-12 gap-2 bg-gradient-to-r from-blue-600 to-purple-700 font-medium text-white shadow-lg hover:from-blue-700 hover:to-purple-800 sm:flex-1">
                    <Home className="h-5 w-5 shrink-0" aria-hidden />На главную<ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Button>
                  <Button onClick={() => (window.location.href = "/login")} variant="outline" className="h-12 gap-2 border-2 border-slate-200 font-medium hover:border-blue-300 hover:bg-blue-50 sm:flex-1">
                    <User className="h-5 w-5 shrink-0" aria-hidden />Войти снова
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">Уведомление автоматически закроется через 10 секунд</p>
              </div>
            </Card>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
