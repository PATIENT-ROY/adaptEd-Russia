"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";

import { useSupport } from "@/hooks/useSupport";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/layout";
import {
  MessageSquare,
  Mail,
  Clock,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  Inbox,
  Reply,
} from "lucide-react";

const SUPPORT_EMAIL = "support@adaptedrussia.ru";
type SupportCategory = "GENERAL" | "CONTENT_ERROR";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  responses: Array<{
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { submitSupportForm } = useSupport();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "GENERAL" as SupportCategory,
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const guideContextApplied = useRef(false);

  useEffect(() => {
    if (guideContextApplied.current) return;
    guideContextApplied.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("category") !== "content-error") return;

    const guide =
      params
        .get("guide")
        ?.replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160) ?? "";
    const source = params.get("source")?.trim().slice(0, 240) ?? "";
    const safeSource = /^\/guides\/(life|education)\/[a-zA-Z0-9-]+$/.test(source)
      ? source
      : "";
    if (!guide || !safeSource) return;

    const subjectTemplate = t("support.form.guideReport.subject");
    const message = [
      t("support.form.guideReport.intro"),
      `${t("support.form.guideReport.guideLabel")}: ${guide}`,
      `${t("support.form.guideReport.sourceLabel")}: ${safeSource}`,
      "",
      t("support.form.guideReport.detailsPrompt"),
    ].join("\n");

    setFormData((current) => ({
      ...current,
      category: "CONTENT_ERROR",
      subject: subjectTemplate.replace("{guide}", guide),
      message,
    }));
  }, [t]);

  const loadMyTickets = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/support/my-tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyTickets(data.data || []);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMyTickets();
    }
  }, [user, loadMyTickets]);

  useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      name: user.name,
      email: user.email,
    }));
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-red-100 text-red-700">{t("support.tickets.status.open")}</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-100 text-yellow-700">{t("support.tickets.status.inProgress")}</Badge>;
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-700">{t("support.tickets.status.resolved")}</Badge>;
      case "CLOSED":
        return <Badge className="bg-gray-100 text-gray-700">{t("support.tickets.status.closed")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!privacyConsent) {
      setSubmitError(t("support.form.error.privacyRequired"));
      return;
    }

    if (formData.name.length < 2) {
      setSubmitError(t("support.form.error.nameMin"));
      return;
    }
    if (formData.subject.length < 5) {
      setSubmitError(t("support.form.error.subjectMin"));
      return;
    }
    if (formData.message.length < 10) {
      setSubmitError(t("support.form.error.messageMin"));
      return;
    }

    setIsSubmitting(true);

    try {
      await submitSupportForm(formData);
      setIsSubmitted(true);
      setFormData({
        name: user?.name ?? "",
        email: user?.email ?? "",
        category: "GENERAL",
        subject: "",
        message: "",
      });
      setPrivacyConsent(false);
      loadMyTickets();
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitError(err instanceof Error ? err.message : t("support.form.error.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = useMemo(
    () =>
      (["login", "language", "reminders", "ai", "guides", "password"] as const).map(
        (id) => ({
          question: t(`support.faq.q.${id}`),
          answer: t(`support.faq.a.${id}`),
        }),
      ),
    [t],
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: t("support.contact.email.title"),
      description: SUPPORT_EMAIL,
      response: t("support.contact.email.response"),
      href: `mailto:${SUPPORT_EMAIL}`,
    },
  ];

  return (
    <Layout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isSubmitted ? (
          <div className="max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl mb-2">
                {t("support.submitted.title")}
              </CardTitle>
              <CardDescription className="text-lg">
                {t("support.submitted.description")}
              </CardDescription>
              <Button onClick={() => setIsSubmitted(false)} className="mt-6">
                {t("support.submitted.sendAnother")}
              </Button>
            </Card>
          </div>
        ) : (
          <>
            {/* Back Button */}
            <BackButton href="/" label={t("support.back")} className="mb-6" />

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {t("support.title")}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t("support.subtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Feedback Form */}
              <div className="lg:col-span-2">
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {t("support.form.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("support.form.subtitle")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("support.form.name")}
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            minLength={2}
                            value={formData.name}
                            onChange={handleInputChange}
                            readOnly={Boolean(user)}
                            aria-readonly={Boolean(user)}
                            className={user ? "bg-gray-50 cursor-not-allowed" : undefined}
                            placeholder={t("support.form.namePlaceholder")}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("support.form.email")}
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            readOnly={Boolean(user)}
                            aria-readonly={Boolean(user)}
                            className={user ? "bg-gray-50 cursor-not-allowed" : undefined}
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t("support.form.category")}
                        </label>
                        <div className="relative">
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="GENERAL">
                              {t("support.form.category.general")}
                            </option>
                            <option value="CONTENT_ERROR">
                              {t("support.form.category.contentError")}
                            </option>
                          </select>
                          <ChevronDown
                            aria-hidden
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t("support.form.subject")}
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          minLength={5}
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder={t("support.form.subjectPlaceholder")}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {t("support.form.message")}
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          minLength={10}
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder={t("support.form.messagePlaceholder")}
                        />
                      </div>

                      {submitError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {submitError}
                        </div>
                      )}

                      {/* Privacy consent */}
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                          type="checkbox"
                          id="privacy-consent"
                          checked={privacyConsent}
                          onChange={(e) => setPrivacyConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label
                          htmlFor="privacy-consent"
                          className="text-sm text-blue-800 cursor-pointer"
                        >
                          {t("support.form.privacyConsent")}{" "}
                          <a
                            href="/personal-data-consent"
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("support.form.consentDoc")}
                          </a>{" "}
                          {t("support.form.privacyConsentAnd")}{" "}
                          <a
                            href="/privacy-policy"
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("support.form.privacyPolicy")}
                          </a>
                        </label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !privacyConsent}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t("support.form.submitting")}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {t("support.form.submit")}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact info sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {t("support.contact.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contactMethods.map((method) => {
                      const Icon = method.icon;
                      const body = (
                        <>
                          <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {method.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {method.response}
                            </p>
                          </div>
                        </>
                      );
                      return method.href ? (
                        <a
                          key={method.title}
                          href={method.href}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 transition hover:bg-gray-100"
                        >
                          {body}
                        </a>
                      ) : (
                        <div
                          key={method.title}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                        >
                          {body}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      {t("support.qa.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {t("support.qa.description")}
                    </p>
                    <Link href="/community/questions">
                      <Button className="w-full">{t("support.qa.button")}</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {t("support.hours.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t("support.hours.weekdays")}</span>
                        <span className="font-medium">{t("support.hours.weekdaysTime")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("support.hours.saturday")}</span>
                        <span className="font-medium">{t("support.hours.saturdayTime")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("support.hours.sunday")}</span>
                        <span className="font-medium">{t("support.hours.sundayTime")}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {t("support.hours.emergency")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* My Tickets */}
            {user && myTickets.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Inbox className="h-6 w-6 text-blue-600" />
                  {t("support.tickets.title")}
                </h2>
                <div className="space-y-4">
                  {myTickets.map((ticket) => (
                    <Card key={ticket.id} className="overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedTicketId(
                          expandedTicketId === ticket.id ? null : ticket.id
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {ticket.subject}
                              </h3>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {ticket.responses.length > 0 && (
                                <span className="ml-2 text-blue-600">
                                  • {ticket.responses.length} {ticket.responses.length === 1 ? t("support.tickets.response") : t("support.tickets.responses")}
                                </span>
                              )}
                            </p>
                          </div>
                          {expandedTicketId === ticket.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedTicketId === ticket.id && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">{t("support.tickets.yourMessage")}</p>
                            <p className="text-gray-700">{ticket.message}</p>
                          </div>

                          {ticket.responses.length > 0 ? (
                            <div className="space-y-3">
                              {ticket.responses.map((response) => (
                                <div
                                  key={response.id}
                                  className={`rounded-lg p-3 ${
                                    response.isAdmin
                                      ? "bg-blue-50 border-l-4 border-blue-400"
                                      : "bg-white border border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {response.isAdmin && (
                                      <Reply className="h-4 w-4 text-blue-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                      {response.isAdmin ? t("support.tickets.support") : t("support.tickets.you")}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(response.createdAt).toLocaleString("ru-RU")}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{response.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-2">
                              {t("support.tickets.noResponses")}
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {t("support.faq.title")}
                </h2>
                <p className="text-gray-600">
                  {t("support.faq.subtitle")}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {faqItems.map((item) => (
                    <Card
                      key={item.question}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-start gap-2">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          {item.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{item.answer}</p>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>

            {/* Resources */}
            <div className="mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    {t("support.resources.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/education-guide" className="text-center p-4 rounded-lg bg-blue-50 transition hover:bg-blue-100">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">{t("support.resources.docs")}</h4>
                      <p className="text-sm text-gray-600">
                        {t("support.resources.docsDesc")}
                      </p>
                    </Link>
                    <Link href="/community/questions" className="text-center p-4 rounded-lg bg-green-50 transition hover:bg-green-100">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">{t("support.resources.community")}</h4>
                      <p className="text-sm text-gray-600">{t("support.resources.communityDesc")}</p>
                    </Link>
                    <Link href="/privacy-policy" className="text-center p-4 rounded-lg bg-orange-50 transition hover:bg-orange-100">
                      <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium">{t("support.resources.security")}</h4>
                      <p className="text-sm text-gray-600">
                        {t("support.resources.securityDesc")}
                      </p>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
    </Layout>
  );
}
