"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { TelegramStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TelegramConnectProps {
  t: (key: string) => string;
  compact?: boolean;
}

export function TelegramConnect({ t, compact = false }: TelegramConnectProps) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"link" | "unlink" | "test" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await apiClient.getTelegramStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.settings.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const connect = async () => {
    setBusy("link");
    setError(null);
    try {
      const link = await apiClient.createTelegramLink();
      window.open(link.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.settings.telegramMissing"));
    } finally {
      setBusy(null);
    }
  };

  const unlink = async () => {
    setBusy("unlink");
    setError(null);
    try {
      setStatus(await apiClient.unlinkTelegram());
      setTestSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.settings.error"));
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setBusy("test");
    setError(null);
    try {
      await apiClient.sendTelegramTest();
      setTestSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.settings.error"));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-3.5",
        compact && "bg-transparent px-0 py-0 border-0",
      )}
    >
      <div className="flex items-start gap-3">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {status?.linked
                ? t("profile.settings.telegramConnected")
                : t("profile.settings.telegram")}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {status?.linked && status.username
                ? `@${status.username}`
                : t("profile.settings.telegramDesc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!status?.linked ? (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl"
                onClick={connect}
                disabled={busy !== null || status?.configured === false}
              >
                {busy === "link" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("profile.settings.telegramConnect")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl"
                  onClick={sendTest}
                  disabled={busy !== null}
                >
                  {busy === "test" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("profile.settings.telegramTest")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-xl"
                  onClick={unlink}
                  disabled={busy !== null}
                >
                  {t("profile.settings.telegramUnlink")}
                </Button>
              </>
            )}
          </div>
          {testSent && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("profile.settings.telegramTestSent")}
            </p>
          )}
          {status?.configured === false && (
            <p className="text-xs text-amber-700">{t("profile.settings.telegramMissing")}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
