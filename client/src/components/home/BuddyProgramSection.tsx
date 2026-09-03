"use client";

import Link from "next/link";

import {
  Globe2,
  HeartHandshake,
  MessageCircle,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Language } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { StaggerReveal, StaggerItem } from "@/components/home/StaggerReveal";

function ConversationBridge() {
  return (
    <div
      className="flex h-full min-h-14 shrink-0 items-center justify-center py-1 md:min-h-full md:px-1 md:py-0"
      aria-hidden
    >
      <div className="flex h-full flex-row items-center md:flex-col">
        <span className="hidden md:block md:h-8 md:w-px md:flex-1 md:bg-gradient-to-b md:from-blue-200 md:to-slate-200" />
        <div className="relative flex items-center pb-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md ring-4 ring-white sm:h-12 sm:w-12">
            <Globe2 className="h-5 w-5" />
          </span>
          <span className="-ms-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md ring-4 ring-white sm:h-12 sm:w-12">
            <Users className="h-5 w-5" />
          </span>
          <span className="absolute bottom-0 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            <MessageCircle className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="hidden md:block md:h-8 md:w-px md:flex-1 md:bg-gradient-to-b md:from-slate-200 md:to-emerald-200" />
      </div>
    </div>
  );
}

function BuddyTrackCard({
  icon: Icon,
  iconClassName,
  role,
  title,
  description,
  href,
  tone,
}: {
  icon: LucideIcon;
  iconClassName: string;
  role: string;
  title: string;
  description: string;
  href: string;
  tone: "student" | "mentor";
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-full min-w-0 flex-col rounded-[24px] bg-white p-6 text-start shadow-[0_10px_32px_rgba(15,23,42,0.07)] ring-1 sm:p-7 ${
        tone === "student" ? "ring-blue-100" : "ring-emerald-100"
      } transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md sm:h-12 sm:w-12 ${iconClassName}`}
        >
          <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden />
        </div>
      </div>
      <p
        className={`mt-5 text-sm font-semibold ${
          tone === "student" ? "text-blue-600" : "text-emerald-700"
        }`}
      >
        {role}
      </p>
      <h3 className="mt-1 text-xl font-bold leading-snug text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
        {description}
      </p>
    </Link>
  );
}

export function BuddyProgramSection() {
  const { t, currentLanguage } = useTranslation();
  const isRtl = currentLanguage === Language.AR;

  return (
    <section
      id="home-buddy"
      dir={isRtl ? "rtl" : "ltr"}
      aria-labelledby="home-buddy-heading"
      className="home-buddy-section relative my-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-12 sm:my-8 sm:rounded-3xl sm:py-16 md:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-y-0 start-0 w-1/2 bg-gradient-to-br from-blue-100/40 to-transparent" />
        <div className="absolute inset-y-0 end-0 w-1/2 bg-gradient-to-bl from-emerald-100/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex max-w-full flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200">
              <HeartHandshake
                className="h-4 w-4 shrink-0 text-indigo-600"
                aria-hidden
              />
              {t("home.buddy.programName")}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {t("home.buddy.programSubtitle")}
            </span>
          </div>
          <h2
            id="home-buddy-heading"
            className="text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl"
          >
            {t("home.buddy.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {t("home.buddy.description")}
          </p>
        </ScrollReveal>

        <StaggerReveal className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4 lg:gap-6">
          <StaggerItem className="h-full min-w-0">
            <BuddyTrackCard
              icon={UserPlus}
              iconClassName="bg-gradient-to-br from-blue-500 to-indigo-600"
              role={t("home.buddy.student.role")}
              title={t("home.buddy.student.title")}
              description={t("home.buddy.student.description")}
              href="/buddy?form=student#application"
              tone="student"
            />
          </StaggerItem>

          <StaggerItem className="flex h-full items-center justify-center">
            <ConversationBridge />
          </StaggerItem>

          <StaggerItem className="h-full min-w-0">
            <BuddyTrackCard
              icon={HeartHandshake}
              iconClassName="bg-gradient-to-br from-emerald-500 to-teal-600"
              role={t("home.buddy.mentor.role")}
              title={t("home.buddy.mentor.title")}
              description={t("home.buddy.mentor.description")}
              href="/buddy?form=mentor#application"
              tone="mentor"
            />
          </StaggerItem>
        </StaggerReveal>
      </div>
    </section>
  );
}
