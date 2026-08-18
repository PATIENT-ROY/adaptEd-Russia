"use client";

import { useEffect, useState } from "react";
import { Bell, KeyRound, Loader2, LogOut, Mail, Shield } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { AccountSettings } from "@/types";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";

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

export function ProfileAccountSettings({ onLogout, t }: ProfileAccountSettingsProps) {
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
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    apiClient
      .getAccountSettings()
      .then(setSettings)
      .catch((error) => setMessage({ text: error instanceof Error ? error.message : t("profile.settings.error"), error: true }))
      .finally(() => setLoadingSettings(false));
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    setMessage(null);
    try {
      setSettings(await apiClient.updateAccountSettings(settings));
      setMessage({ text: t("profile.settings.saved") });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t("profile.settings.error"), error: true });
    } finally {
      setSavingSettings(false);
    }
  };

  const changePassword = async () => {
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ text: t("profile.settings.passwordMismatch"), error: true });
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setMessage({ text: t("profile.settings.passwordChanged") });
      setTimeout(onLogout, 1200);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t("profile.settings.error"), error: true });
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
      setMessage({ text: error instanceof Error ? error.message : t("profile.settings.error"), error: true });
      setLoggingOutAll(false);
    }
  };

  if (loadingSettings) {
    return <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-slate-900">{t("profile.settings.notifications")}</h3>
            <p className="text-sm text-slate-500">{t("profile.settings.notificationsDesc")}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-500" />
            <Label htmlFor="email-notifications">{t("profile.settings.emailNotifications")}</Label>
          </div>
          <Switch id="email-notifications" checked={settings.emailNotifications} onCheckedChange={(checked) => setSettings((value) => ({ ...value, emailNotifications: checked }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">{t("profile.settings.timezone")}</Label>
          <select id="timezone" value={settings.timezone} onChange={(event) => setSettings((value) => ({ ...value, timezone: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            {TIMEZONES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <Button onClick={saveSettings} disabled={savingSettings} className="w-full">
          {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("profile.settings.save")}
        </Button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-slate-900">{t("profile.settings.security")}</h3>
            <p className="text-sm text-slate-500">{t("profile.settings.securityDesc")}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="current-password">{t("profile.settings.currentPassword")}</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-password">{t("profile.settings.newPassword")}</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="confirm-password">{t("profile.settings.confirmPassword")}</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
        </div>
        <Button onClick={changePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} variant="outline" className="w-full">
          {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{t("profile.settings.changePassword")}
        </Button>
        <Button onClick={logoutAll} disabled={loggingOutAll} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
          {loggingOutAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}{t("profile.settings.logoutAll")}
        </Button>
      </section>

      {message && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message.text}</p>}
    </div>
  );
}
