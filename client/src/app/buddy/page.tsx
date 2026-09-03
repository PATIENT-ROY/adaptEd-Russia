"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  SearchCheck,
  Send,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { buddyT, type BuddyKey } from "@/lib/buddy-i18n";
import {
  fetchMyBuddyApplications,
  submitBuddyApplication,
  type BuddyApplicationInput,
  type BuddyApplicationSummary,
  type BuddyApplicationType,
  type BuddyContactMethod,
  type BuddyHelpTopic,
  type BuddyParticipantStatus,
} from "@/lib/buddy-api";
import { Language } from "@/types";

const HELP_TOPICS: BuddyHelpTopic[] = [
  "CITY_ORIENTATION",
  "TRANSPORT",
  "STUDIES",
  "DAILY_LIFE",
  "RUSSIAN_PRACTICE",
  "SOCIAL_CULTURAL",
  "OTHER",
];
const CONTACT_METHODS: BuddyContactMethod[] = [
  "EMAIL",
  "PHONE",
  "TELEGRAM",
  "WHATSAPP",
  "OTHER",
];
const PARTICIPANT_STATUSES: BuddyParticipantStatus[] = [
  "LOCAL_RESIDENT",
  "STUDENT",
  "GRADUATE",
  "OTHER",
];

type FormState = {
  name: string;
  adult: boolean;
  country: string;
  city: string;
  affiliation: string;
  participantStatus: BuddyParticipantStatus;
  languages: string;
  helpTopics: BuddyHelpTopic[];
  interests: string;
  availability: string;
  contactMethod: BuddyContactMethod;
  contact: string;
  motivation: string;
  comment: string;
  rules: boolean;
  dataPolicy: boolean;
};

const initialForm: FormState = {
  name: "",
  adult: false,
  country: "",
  city: "",
  affiliation: "",
  participantStatus: "LOCAL_RESIDENT",
  languages: "",
  helpTopics: [],
  interests: "",
  availability: "",
  contactMethod: "EMAIL",
  contact: "",
  motivation: "",
  comment: "",
  rules: false,
  dataPolicy: false,
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const labelClass = "block text-sm font-semibold text-slate-800";

function localeFor(language: Language) {
  return {
    [Language.RU]: "ru-RU",
    [Language.EN]: "en-US",
    [Language.FR]: "fr-FR",
    [Language.AR]: "ar",
    [Language.ZH]: "zh-CN",
  }[language];
}

function ApplicationForm({
  type,
  onSubmitted,
}: {
  type: BuddyApplicationType;
  onSubmitted: (application: BuddyApplicationSummary) => void;
}) {
  const { user } = useAuth();
  const { currentLanguage } = useTranslation();
  const bt = useCallback(
    (key: BuddyKey) => buddyT(currentLanguage, key),
    [currentLanguage],
  );
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    name: user?.name || "",
    country: user?.country || "",
    affiliation: user?.university || "",
    contact: user?.email || "",
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      name: previous.name || user?.name || "",
      country: previous.country || user?.country || "",
      affiliation: previous.affiliation || user?.university || "",
      contact: previous.contact || user?.email || "",
    }));
  }, [user]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  };

  const toggleTopic = (topic: BuddyHelpTopic) => {
    setValue(
      "helpTopics",
      form.helpTopics.includes(topic)
        ? form.helpTopics.filter((item) => item !== topic)
        : [...form.helpTopics, topic],
    );
  };

  const validate = () => {
    if (!form.adult) return bt("error.adult");
    if (!form.rules || !form.dataPolicy) return bt("error.consent");
    const required = [form.name, form.city, form.languages, form.availability, form.contact];
    if (type === "STUDENT") required.push(form.country);
    if (type === "MENTOR") required.push(form.motivation);
    if (required.some((value) => !value.trim()) || form.helpTopics.length === 0) {
      return bt("error.required");
    }
    if (
      form.name.length > 100 ||
      form.city.length > 100 ||
      form.country.length > 100 ||
      form.affiliation.length > 160 ||
      form.languages.length > 300 ||
      form.interests.length > 500 ||
      form.availability.length > 300 ||
      form.contact.length > 200 ||
      form.motivation.length > 1000 ||
      form.comment.length > 1000 ||
      (type === "MENTOR" && form.motivation.trim().length < 20)
    ) {
      return bt("error.length");
    }
    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const languages = [...new Set(
      form.languages
        .split(/[,،，]/u)
        .map((value) => value.trim())
        .filter(Boolean),
    )].slice(0, 8);
    if (!languages.length || languages.some((value) => value.length > 40)) {
      setError(bt("error.length"));
      return;
    }

    const payload: BuddyApplicationInput = {
      type,
      name: form.name,
      isAdult: true,
      city: form.city,
      affiliation: form.affiliation || undefined,
      languages,
      helpTopics: form.helpTopics,
      interests: form.interests || undefined,
      availability: form.availability,
      contactMethod: form.contactMethod,
      contact: form.contact,
      agreedToRules: true,
      agreedToDataPolicy: true,
      ...(type === "STUDENT"
        ? { country: form.country, comment: form.comment || undefined }
        : {
            participantStatus: form.participantStatus,
            motivation: form.motivation,
          }),
    };

    setSubmitting(true);
    setError("");
    try {
      const created = await submitBuddyApplication(payload);
      onSubmitted({ ...created, city: form.city });
    } catch (submitError) {
      const code = submitError instanceof Error ? submitError.name : "SERVER_ERROR";
      setError(
        code === "BUDDY_RATE_LIMITED"
          ? bt("error.rate")
          : code === "VALIDATION_ERROR"
            ? bt("error.required")
            : code === "UNAUTHORIZED"
              ? bt("error.unauthorized")
              : bt("error.server"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" data-testid={`buddy-${type.toLowerCase()}-form`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          {bt("field.name")} *
          <input data-testid="buddy-name" className={fieldClass} value={form.name} onChange={(e) => setValue("name", e.target.value)} maxLength={100} autoComplete="name" required />
        </label>
        {type === "STUDENT" && (
          <label className={labelClass}>
            {bt("field.country")} *
            <input data-testid="buddy-country" className={fieldClass} value={form.country} onChange={(e) => setValue("country", e.target.value)} maxLength={100} autoComplete="country-name" required />
          </label>
        )}
        <label className={labelClass}>
          {bt(type === "STUDENT" ? "field.city" : "field.mentorCity")} *
          <input data-testid="buddy-city" className={fieldClass} value={form.city} onChange={(e) => setValue("city", e.target.value)} maxLength={100} autoComplete="address-level2" required />
        </label>
        {type === "MENTOR" && (
          <label className={labelClass}>
            {bt("field.status")} *
            <select className={fieldClass} value={form.participantStatus} onChange={(e) => setValue("participantStatus", e.target.value as BuddyParticipantStatus)}>
              {PARTICIPANT_STATUSES.map((status) => (
                <option key={status} value={status}>{bt(`status.${status === "LOCAL_RESIDENT" ? "local" : status.toLowerCase()}` as BuddyKey)}</option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          {bt(type === "STUDENT" ? "field.affiliation.student" : "field.affiliation.mentor")}
          <input className={fieldClass} value={form.affiliation} onChange={(e) => setValue("affiliation", e.target.value)} maxLength={160} />
        </label>
        <label className={labelClass}>
          {bt("field.languages")} *
          <input data-testid="buddy-languages" className={fieldClass} value={form.languages} onChange={(e) => setValue("languages", e.target.value)} maxLength={300} aria-describedby="buddy-language-hint" required />
          <span id="buddy-language-hint" className="mt-1 block text-xs font-normal text-slate-500">{bt("field.languagesHint")}</span>
        </label>
      </div>

      <fieldset>
        <legend className={labelClass}>{bt(type === "STUDENT" ? "field.help.student" : "field.help.mentor")} *</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {HELP_TOPICS.map((topic) => (
            <label key={topic} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 transition hover:border-indigo-300">
              <input data-testid={`buddy-topic-${topic}`} type="checkbox" checked={form.helpTopics.includes(topic)} onChange={() => toggleTopic(topic)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>{bt(`topic.${topic}` as BuddyKey)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          {bt("field.interests")}
          <textarea className={fieldClass} value={form.interests} onChange={(e) => setValue("interests", e.target.value)} maxLength={500} rows={3} />
        </label>
        <label className={labelClass}>
          {bt(type === "STUDENT" ? "field.availability.student" : "field.availability.mentor")} *
          <textarea data-testid="buddy-availability" className={fieldClass} value={form.availability} onChange={(e) => setValue("availability", e.target.value)} maxLength={300} rows={3} required />
        </label>
        <label className={labelClass}>
          {bt("field.contactMethod")} *
          <select className={fieldClass} value={form.contactMethod} onChange={(e) => setValue("contactMethod", e.target.value as BuddyContactMethod)}>
            {CONTACT_METHODS.map((method) => <option key={method} value={method}>{bt(`contact.${method}` as BuddyKey)}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          {bt("field.contact")} *
          <input data-testid="buddy-contact" className={fieldClass} value={form.contact} onChange={(e) => setValue("contact", e.target.value)} maxLength={200} autoComplete="email" required />
        </label>
      </div>

      {type === "STUDENT" ? (
        <label className={labelClass}>
          {bt("field.comment")}
          <textarea className={fieldClass} value={form.comment} onChange={(e) => setValue("comment", e.target.value)} maxLength={1000} rows={4} />
        </label>
      ) : (
        <label className={labelClass}>
          {bt("field.motivation")} *
          <textarea data-testid="buddy-motivation" className={fieldClass} value={form.motivation} onChange={(e) => setValue("motivation", e.target.value)} minLength={20} maxLength={1000} rows={4} required />
        </label>
      )}

      <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input data-testid="buddy-adult" type="checkbox" checked={form.adult} onChange={(e) => setValue("adult", e.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
          <span>{bt("field.adult")} *</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input data-testid="buddy-rules" type="checkbox" checked={form.rules} onChange={(e) => setValue("rules", e.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
          <span>{bt(type === "STUDENT" ? "field.rules.student" : "field.rules.mentor")} *</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input data-testid="buddy-data-policy" type="checkbox" checked={form.dataPolicy} onChange={(e) => setValue("dataPolicy", e.target.checked)} className="mt-0.5 h-4 w-4 rounded" />
          <span>{bt("field.data")} *</span>
        </label>
        <div className="flex flex-wrap gap-x-4 gap-y-2 ps-7 text-sm">
          <Link href="/privacy-policy" className="font-medium text-indigo-700 underline underline-offset-2">{bt("privacy")}</Link>
          <Link href="/personal-data-consent" className="font-medium text-indigo-700 underline underline-offset-2">{bt("dataPolicy")}</Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button data-testid="buddy-submit" type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-indigo-600 text-base text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4" />}
        {bt(submitting ? "submitting" : "submit")}
      </Button>
    </form>
  );
}

export default function BuddyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentLanguage } = useTranslation();
  const bt = useCallback((key: BuddyKey) => buddyT(currentLanguage, key), [currentLanguage]);
  const isRtl = currentLanguage === Language.AR;
  const [selectedType, setSelectedType] = useState<BuddyApplicationType>("STUDENT");
  const [submitted, setSubmitted] = useState<BuddyApplicationSummary | null>(null);
  const [applications, setApplications] = useState<BuddyApplicationSummary[]>([]);
  const [mineLoading, setMineLoading] = useState(false);
  const [mineError, setMineError] = useState("");
  const formRef = useRef<HTMLElement | null>(null);

  const loadMine = useCallback(async () => {
    if (!user) return;
    setMineLoading(true);
    setMineError("");
    try {
      setApplications(await fetchMyBuddyApplications());
    } catch {
      setMineError(bt("mine.loadError"));
    } finally {
      setMineLoading(false);
    }
  }, [bt, user]);

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("form");
    if (type === "mentor") setSelectedType("MENTOR");
    if (type === "student") setSelectedType("STUDENT");
  }, []);

  useEffect(() => {
    if (user) void loadMine();
  }, [loadMine, user]);

  const selectType = (type: BuddyApplicationType) => {
    setSelectedType(type);
    setSubmitted(null);
    const value = type === "STUDENT" ? "student" : "mentor";
    window.history.replaceState(null, "", `/buddy?form=${value}#application`);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const how = useMemo(() => [
    ["how.1.title", "how.1.desc", UserRoundPlus],
    ["how.2.title", "how.2.desc", SearchCheck],
    ["how.3.title", "how.3.desc", UsersRound],
    ["how.4.title", "how.4.desc", HeartHandshake],
  ] as const, []);

  return (
    <Layout>
      <div dir={isRtl ? "rtl" : "ltr"} className="space-y-12 pb-12 pt-4 sm:space-y-16 sm:pt-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-5 py-10 ring-1 ring-indigo-100 sm:px-10 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100"><HeartHandshake className="h-4 w-4" />{bt("name")}</span>
            <p className="mt-4 font-semibold text-slate-600">{bt("subtitle")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">{bt("hero")}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{bt("description")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{bt("free")}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2"><ShieldCheck className="h-4 w-4 text-blue-600" />{bt("adult")}</span>
            </div>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {(["STUDENT", "MENTOR"] as const).map((type) => (
              <article key={type} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-bold text-slate-900">{bt(type === "STUDENT" ? "student.title" : "mentor.title")}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{bt(type === "STUDENT" ? "student.desc" : "mentor.desc")}</p>
                <Button data-testid={`buddy-open-${type.toLowerCase()}`} onClick={() => selectType(type)} className={`mt-5 w-full rounded-xl text-white ${type === "STUDENT" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>{bt("openForm")}</Button>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="buddy-how-heading">
          <h2 id="buddy-how-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">{bt("how.title")}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {how.map(([title, description, Icon], index) => (
              <article key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">{index + 1}</span>
                <Icon className="mt-5 h-5 w-5 text-indigo-600" />
                <h3 className="mt-3 font-bold text-slate-900">{bt(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{bt(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-bold"><ShieldCheck className="h-7 w-7 text-emerald-400" />{bt("rules.title")}</h2>
            <ul className="mt-6 space-y-4">
              {([1, 2, 3, 4, 5, 6] as const).map((number) => (
                <li key={number} className="flex items-start gap-3 text-sm leading-6 text-slate-200"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /><span>{bt(`rules.${number}` as BuddyKey)}</span></li>
              ))}
            </ul>
            <p className="mt-6 border-t border-slate-700 pt-5 text-sm text-slate-200">{bt("rules.report")} <Link href="/support" className="font-semibold text-white underline underline-offset-2">/support</Link></p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href="/privacy-policy" className="text-indigo-200 underline underline-offset-2">{bt("privacy")}</Link><Link href="/personal-data-consent" className="text-indigo-200 underline underline-offset-2">{bt("dataPolicy")}</Link></div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">{bt("faq.title")}</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {([1, 2, 3, 4] as const).map((number) => (
                <details key={number} className="group py-4" open={number === 1}>
                  <summary className="cursor-pointer list-none rounded-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{bt(`faq.${number}.q` as BuddyKey)}</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{bt(`faq.${number}.a` as BuddyKey)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {user && (
          <section aria-labelledby="buddy-mine-heading" className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100 sm:p-7">
            <h2 id="buddy-mine-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900"><Clock3 className="h-5 w-5 text-blue-600" />{bt("mine.title")}</h2>
            {mineLoading ? <Loader2 className="mt-5 h-5 w-5 animate-spin text-blue-600" /> : mineError ? <p role="alert" className="mt-4 text-sm text-red-700">{mineError}</p> : applications.length === 0 ? <p className="mt-4 text-sm text-slate-600">{bt("mine.empty")}</p> : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {applications.map((application) => (
                  <article key={application.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><strong className="text-sm text-slate-900">{bt(application.type === "STUDENT" ? "application.student" : "application.mentor")}</strong><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{bt(`application.${application.status}` as BuddyKey)}</span></div>
                    <p className="mt-2 text-xs text-slate-500">{bt("application.date").replace("{date}", new Intl.DateTimeFormat(localeFor(currentLanguage)).format(new Date(application.createdAt)))}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section ref={formRef} id="application" tabIndex={-1} className="scroll-mt-24 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{bt("form.title")}</h2>
            <div role="tablist" className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              {(["STUDENT", "MENTOR"] as const).map((type) => (
                <button key={type} type="button" role="tab" aria-selected={selectedType === type} onClick={() => selectType(type)} className={`min-h-12 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selectedType === type ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{bt(type === "STUDENT" ? "student.title" : "mentor.title")}</button>
              ))}
            </div>
            {authLoading ? <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : !user ? (
              <div className="mt-6 rounded-2xl bg-indigo-50 p-6 text-center">
                <LockKeyhole className="mx-auto h-9 w-9 text-indigo-600" />
                <h3 className="mt-3 text-lg font-bold text-slate-900">{bt("form.login.title")}</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{bt("form.login.desc")}</p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/login?returnTo=${encodeURIComponent(`/buddy?form=${selectedType.toLowerCase()}#application`)}`}><Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto">{bt("form.login")}</Button></Link><Link href={`/register?returnTo=${encodeURIComponent(`/buddy?form=${selectedType.toLowerCase()}#application`)}`}><Button variant="outline" className="w-full sm:w-auto">{bt("form.register")}</Button></Link></div>
              </div>
            ) : submitted ? (
              <div data-testid="buddy-success" className="mt-6 rounded-2xl bg-emerald-50 p-7 text-center ring-1 ring-emerald-100">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h3 className="mt-3 text-xl font-bold text-slate-900">{bt("success.title")}</h3>
                <p className="mt-2 text-sm text-slate-600">{bt("success.desc")}</p>
                <Button variant="outline" onClick={() => setSubmitted(null)} className="mt-5">{bt("success.another")}</Button>
              </div>
            ) : <div className="mt-7"><ApplicationForm key={selectedType} type={selectedType} onSubmitted={(application) => { setSubmitted(application); setApplications((items) => [application, ...items]); }} /></div>}
          </div>
        </section>
      </div>
    </Layout>
  );
}
