"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Send } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { API_BASE_URL } from "@/lib/api";

export default function AdminNotificationsPage() {
  return <ProtectedRoute><AdminNotificationsContent /></ProtectedRoute>;
}

function AdminNotificationsContent() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<"USER" | "ALL">("USER");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  if (user?.role !== Role.ADMIN) {
    return <Layout><div className="flex min-h-[60vh] items-center justify-center text-slate-600">Доступ запрещён</div></Layout>;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          audience,
          email: audience === "USER" ? email.trim() : undefined,
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          confirmAll: audience === "ALL" ? confirmAll : undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Не удалось отправить сообщение");
      setResult({ kind: "success", text: `Сообщение отправлено: ${body.data.sent}` });
      setTitle("");
      setMessage("");
      setLink("");
      setConfirmAll(false);
    } catch (error) {
      setResult({ kind: "error", text: error instanceof Error ? error.message : "Не удалось отправить сообщение" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><ArrowLeft className="h-5 w-5" /></Link>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Bell className="h-6 w-6" /></span>
          <div><h1 className="text-2xl font-bold text-slate-900">Сообщение пользователям</h1><p className="text-sm text-slate-600">Внутреннее уведомление без email и Telegram</p></div>
        </div>

        <Card><CardContent className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-800">Получатели</legend>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => { setAudience("USER"); setConfirmAll(false); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${audience === "USER" ? "bg-white shadow-sm" : "text-slate-600"}`}>Один пользователь</button>
                <button type="button" onClick={() => setAudience("ALL")} className={`rounded-lg px-3 py-2 text-sm font-medium ${audience === "ALL" ? "bg-white shadow-sm" : "text-slate-600"}`}>Все пользователи</button>
              </div>
            </fieldset>

            {audience === "USER" && <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email пользователя</span><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" /></label>}
            {audience === "ALL" && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><p>Сообщение получат все активные пользователи, кроме администраторов.</p><label className="mt-3 flex cursor-pointer items-start gap-2 font-medium"><input type="checkbox" required checked={confirmAll} onChange={(event) => setConfirmAll(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-amber-400" />Я проверил сообщение и подтверждаю массовую отправку</label></div>}

            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Заголовок</span><Input required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Сообщение</span><textarea required minLength={2} maxLength={2000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Ссылка внутри сайта (необязательно)</span><Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="/support" pattern="/.*" /></label>

            {result && <div role="alert" className={`rounded-xl px-4 py-3 text-sm ${result.kind === "success" ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-800"}`}>{result.text}</div>}
            <Button type="submit" disabled={sending} className="w-full gap-2"><Send className="h-4 w-4" />{sending ? "Отправка…" : "Отправить уведомление"}</Button>
          </form>
        </CardContent></Card>
      </main>
    </Layout>
  );
}
