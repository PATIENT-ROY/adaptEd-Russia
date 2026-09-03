"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, HeartHandshake, Loader2, Save, Shield } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buddyT, type BuddyKey } from "@/lib/buddy-i18n";
import {
  fetchBuddyAdminApplication,
  fetchBuddyAdminApplications,
  updateBuddyAdminApplication,
  type BuddyApplicationDetail,
  type BuddyApplicationStatus,
  type BuddyApplicationSummary,
  type BuddyApplicationType,
} from "@/lib/buddy-api";
import { Role } from "@/types";

const STATUSES: BuddyApplicationStatus[] = ["NEW", "UNDER_REVIEW", "APPROVED", "MATCHED", "REJECTED", "CLOSED"];

export default function BuddyAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentLanguage } = useTranslation();
  const bt = useCallback((key: BuddyKey) => buddyT(currentLanguage, key), [currentLanguage]);
  const [applications, setApplications] = useState<BuddyApplicationSummary[]>([]);
  const [detail, setDetail] = useState<BuddyApplicationDetail | null>(null);
  const [type, setType] = useState<"" | BuddyApplicationType>("");
  const [status, setStatus] = useState<"" | BuddyApplicationStatus>("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState("");
  const [editStatus, setEditStatus] = useState<BuddyApplicationStatus>("NEW");

  const isAdmin = user?.role === Role.ADMIN;

  const loadList = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchBuddyAdminApplications({ type: type || undefined, status: status || undefined, city: city.trim() || undefined });
      setApplications(result.applications);
      setNewCount(result.newCount);
      setTotal(result.total);
    } catch {
      setError(bt("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [bt, city, isAdmin, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList(), 250);
    return () => window.clearTimeout(timer);
  }, [loadList]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const application = await fetchBuddyAdminApplication(id);
      setDetail(application);
      setNote(application.internalNote || "");
      setEditStatus(application.status);
    } catch {
      setError(bt("admin.openError"));
    } finally {
      setDetailLoading(false);
    }
  };

  const save = async () => {
    if (!detail || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateBuddyAdminApplication(detail.id, {
        status: editStatus,
        internalNote: note.trim() || null,
      });
      setDetail(updated);
      await loadList();
    } catch {
      setError(bt("admin.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <Layout><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div></Layout>;
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
          <Shield className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{bt("admin.forbidden.title")}</h1>
          <p className="mt-2 text-slate-600">{bt("admin.forbidden.desc")}</p>
          <Link href="/dashboard"><Button className="mt-5">{bt("admin.home")}</Button></Link>
        </div>
      </Layout>
    );
  }

  const participantStatusKey = detail?.participantStatus
    ? (`status.${detail.participantStatus === "LOCAL_RESIDENT" ? "local" : detail.participantStatus.toLowerCase()}` as BuddyKey)
    : null;

  const detailRows = detail ? [
    { key: "name", label: bt("admin.field.name"), value: detail.name },
    { key: "adult", label: bt("admin.field.adult"), value: detail.isAdult ? bt("admin.field.adultYes") : bt("admin.field.adultNo") },
    { key: "country", label: bt("admin.field.country"), value: detail.country },
    { key: "city", label: bt("admin.field.city"), value: detail.city },
    { key: "participantStatus", label: bt("admin.field.participantStatus"), value: participantStatusKey ? bt(participantStatusKey) : null },
    { key: "affiliation", label: bt("admin.field.affiliation"), value: detail.affiliation },
    { key: "languages", label: bt("admin.field.languages"), value: detail.languages.join(", ") },
    { key: "help", label: bt("admin.field.help"), value: detail.helpTopics.map((topic) => bt(`topic.${topic}` as BuddyKey)).join(", ") },
    { key: "interests", label: bt("admin.field.interests"), value: detail.interests },
    { key: "availability", label: bt("admin.field.availability"), value: detail.availability },
    { key: "contactMethod", label: bt("admin.field.contactMethod"), value: bt(`contact.${detail.contactMethod}` as BuddyKey) },
    { key: "contact", label: bt("admin.field.contact"), value: detail.contact },
    { key: "motivation", label: bt("admin.field.motivation"), value: detail.motivation },
    { key: "comment", label: bt("admin.field.comment"), value: detail.comment },
    { key: "account", label: bt("admin.field.account"), value: detail.user?.email },
  ].filter((row): row is { key: string; label: string; value: string } => Boolean(row.value)) : [];

  return (
    <Layout>
      <div className="space-y-6 pb-12 pt-4 sm:pt-8">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
              <ArrowLeft className="h-4 w-4" />{bt("admin.back")}
            </Link>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              <HeartHandshake className="h-7 w-7 text-indigo-600" />AdaptEd Buddy
            </h1>
            <p className="mt-1 text-sm text-slate-600">{bt("admin.subtitle")}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <strong className="block text-xl text-slate-900">{total}</strong>
              <span className="text-xs text-slate-500">{bt("admin.filtered")}</span>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center">
              <strong data-testid="buddy-new-count" className="block text-xl text-amber-800">{newCount}</strong>
              <span className="text-xs text-amber-700">{bt("admin.new")}</span>
            </div>
          </div>
        </header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <label className="text-sm font-semibold text-slate-700">{bt("admin.filter.type")}
                <select data-testid="buddy-filter-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                  <option value="">{bt("admin.filter.all")}</option>
                  <option value="STUDENT">{bt("application.student")}</option>
                  <option value="MENTOR">{bt("application.mentor")}</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">{bt("admin.filter.status")}
                <select data-testid="buddy-filter-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                  <option value="">{bt("admin.filter.all")}</option>
                  {STATUSES.map((item) => <option key={item} value={item}>{bt(`application.${item}` as BuddyKey)}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">{bt("admin.filter.city")}
                <input data-testid="buddy-filter-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
            </div>
            <div className="mt-5 space-y-2">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
              ) : applications.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">{bt("admin.empty")}</p>
              ) : applications.map((application) => (
                <button data-testid={`buddy-admin-row-${application.id}`} key={application.id} type="button" onClick={() => void openDetail(application.id)} className={`w-full rounded-2xl border p-4 text-start transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${detail?.id === application.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-slate-900">{bt(application.type === "STUDENT" ? "application.student" : "application.mentor")}</strong>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{bt(`application.${application.status}` as BuddyKey)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{application.city} · {(application.languages || []).join(", ")}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(application.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-96 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            {detailLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            ) : !detail ? (
              <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">{bt("admin.pick")}</div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{bt(detail.type === "STUDENT" ? "application.student" : "application.mentor")}</h2>
                    <p className="mt-1 text-xs text-slate-500">ID: {detail.id}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{bt(`application.${detail.status}` as BuddyKey)}</span>
                </div>
                <dl className="mt-6 grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {detailRows.map((row) => (
                    <div key={row.key} className="min-w-0">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{row.label}</dt>
                      <dd className={`mt-1 whitespace-pre-wrap break-words text-sm text-slate-800 ${row.key === "contact" ? "rounded-lg bg-amber-50 p-2 font-semibold text-amber-900" : ""}`}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-7 border-t border-slate-200 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">{bt("admin.field.status")}
                      <select data-testid="buddy-admin-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value as BuddyApplicationStatus)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal">
                        {STATUSES.map((item) => <option key={item} value={item}>{bt(`application.${item}` as BuddyKey)}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">{bt("admin.field.note")}
                      <textarea data-testid="buddy-admin-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={5} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" />
                      <span className="mt-1 block text-xs font-normal text-slate-500">{bt("admin.field.noteHint")}</span>
                    </label>
                  </div>
                  <Button data-testid="buddy-admin-save" onClick={() => void save()} disabled={saving} className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700">
                    {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                    {bt("admin.save")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
