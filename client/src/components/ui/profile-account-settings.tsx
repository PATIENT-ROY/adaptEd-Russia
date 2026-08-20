"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Shield,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import type { AccountSettings } from "@/types";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { cn } from "@/lib/utils";

interface ProfileAccountSettingsProps {
  onLogout: () => void;
  t: (key: string) => string;
}

const TIMEZONES = [
  ["Europe/Kaliningrad", "UTC+2 — Калининград"],
  ["Europe/Moscow", "UTC+3 — Москва"],
  ["Europe/Samara", "UTC+4 — Самара"],
  ["Asia/Yekaterinburg", "UTC+5 — Екатеринбург"],
  ["Asia/Omsk", "UTC+6 — Омск"],
  ["Asia/Krasnoyarsk", "UTC+7 — Красноярск"],
  ["Asia/Irkutsk", "UTC+8 — Иркутск"],
  ["Asia/Yakutsk", "UTC+9 — Якутск"],
  ["Asia/Vladivostok", "UTC+10 — Владивосток"],
  ["Asia/Magadan", "UTC+11 — Магадан"],
  ["Asia/Kamchatka", "UTC+12 — Камчатка"],
] as const;

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function SettingsCardEntry({
  icon: Icon,
  title,
  description,
  onOpen,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-5"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
          {title}
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
          {description}
        </p>
      </div>
      <ChevronRight
        aria-hidden
        className="mt-2 h-5 w-5 shrink-0 text-slate-400"
      />
    </button>
  );
}

function SettingsModalShell({
  open,
  title,
  icon: Icon,
  onClose,
  closeLabel,
  children,
}: {
  open: boolean;
  title: string;
  icon: typeof Bell;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex w-full max-h-[88dvh] flex-col overflow-hidden bg-white shadow-2xl",
          "rounded-t-2xl sm:max-w-md sm:rounded-2xl",
          "animate-slide-in-from-bottom",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggleVisible,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </Label>
      <div className="relative">
        <Input
          className={fieldClass}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ProfileAccountSettings({
  onLogout,
  t,
}: ProfileAccountSettingsProps) {
  const [settings, setSettings] = useState<AccountSettings>({
    emailNotifications: true,
    timezone: "Europe/Moscow",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activePanel, setActivePanel] = useState<
    null | "notifications" | "security"
  >(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    apiClient
      .getAccountSettings()
      .then(setSettings)
      .catch((error) =>
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : t("profile.settings.error"),
          error: true,
        }),
      )
      .finally(() => setLoadingSettings(false));
  }, [t]);

  const saveSettings = async () => {
    setSavingSettings(true);
    setMessage(null);
    try {
      setSettings(await apiClient.updateAccountSettings(settings));
      setMessage({ text: t("profile.settings.saved") });
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : t("profile.settings.error"),
        error: true,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const changePassword = async () => {
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({
        text: t("profile.settings.passwordMismatch"),
        error: true,
      });
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setMessage({ text: t("profile.settings.passwordChanged") });
      setTimeout(onLogout, 1200);
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : t("profile.settings.error"),
        error: true,
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm(t("profile.settings.logoutAllConfirm"))) return;
    setLoggingOutAll(true);
    try {
      await apiClient.logoutAll();
      onLogout();
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : t("profile.settings.error"),
        error: true,
      });
      setLoggingOutAll(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {message && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
            message.error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          {!message.error && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p className="leading-snug">{message.text}</p>
        </div>
      )}

      {/* Notifications */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <SettingsCardEntry
          icon={Bell}
          title={t("profile.settings.notifications")}
          description={t("profile.settings.notificationsDesc")}
          onOpen={() => setActivePanel("notifications")}
        />
      </section>

      {/* Security */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <SettingsCardEntry
          icon={Shield}
          title={t("profile.settings.security")}
          description={t("profile.settings.securityDesc")}
          onOpen={() => setActivePanel("security")}
        />
      </section>

      <SettingsModalShell
        open={activePanel === "notifications"}
        icon={Bell}
        title={t("profile.settings.notifications")}
        onClose={() => setActivePanel(null)}
        closeLabel={t("templates.back")}
      >
        <div className="space-y-4">
          <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-slate-500" />
              <Label
                className="cursor-pointer text-sm font-medium leading-snug text-slate-800"
                htmlFor="email-notifications"
              >
                {t("profile.settings.emailNotifications")}
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings((value) => ({
                  ...value,
                  emailNotifications: checked,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-slate-700"
              htmlFor="timezone"
            >
              {t("profile.settings.timezone")}
            </Label>
            <div className="relative">
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(event) =>
                  setSettings((value) => ({
                    ...value,
                    timezone: event.target.value,
                  }))
                }
                className={cn(fieldClass, "appearance-none pr-10")}
              >
                {TIMEZONES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              onClick={saveSettings}
              disabled={savingSettings}
              size="sm"
              className="h-10 w-full rounded-xl sm:w-auto sm:min-w-[180px]"
            >
              {savingSettings && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("profile.settings.save")}
            </Button>
          </div>
        </div>
      </SettingsModalShell>

      <SettingsModalShell
        open={activePanel === "security"}
        icon={Shield}
        title={t("profile.settings.security")}
        onClose={() => setActivePanel(null)}
        closeLabel={t("templates.back")}
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            <PasswordField
              id="current-password"
              label={t("profile.settings.currentPassword")}
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              visible={showCurrentPassword}
              onToggleVisible={() => setShowCurrentPassword((v) => !v)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <PasswordField
              id="new-password"
              label={t("profile.settings.newPassword")}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              visible={showNewPassword}
              onToggleVisible={() => setShowNewPassword((v) => !v)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
            <PasswordField
              id="confirm-password"
              label={t("profile.settings.confirmPassword")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((v) => !v)}
              showLabel={t("login.showPassword")}
              hideLabel={t("login.hidePassword")}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <Button
              onClick={changePassword}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              variant="outline"
              size="sm"
              className="h-10 w-full whitespace-normal rounded-xl border-slate-200 shadow-none"
            >
              {changingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4 shrink-0" />
              )}
              {t("profile.settings.changePassword")}
            </Button>
            <Button
              onClick={logoutAll}
              disabled={loggingOutAll}
              variant="ghost"
              size="sm"
              className="h-auto min-h-10 w-full whitespace-normal rounded-xl px-3 py-2.5 text-left text-sm leading-snug text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {loggingOutAll ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                {t("profile.settings.logoutAll")}
              </span>
            </Button>
          </div>
        </div>
      </SettingsModalShell>
    </div>
  );
}

