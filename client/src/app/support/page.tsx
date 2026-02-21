"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useSupport } from "@/hooks/useSupport";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import type { FAQItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Globe,
  Shield,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Inbox,
  Reply,
} from "lucide-react";

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
  const router = useRouter();
  const { user } = useAuth();
  const { submitSupportForm, getFAQ } = useSupport();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Загрузка своих обращений
  const loadMyTickets = async () => {
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
      console.error("Ошибка при загрузке обращений:", error);
    }
  };

  // Загружаем обращения при авторизации
  useEffect(() => {
    if (user) {
      loadMyTickets();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-red-100 text-red-700">Открыто</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-100 text-yellow-700">В работе</Badge>;
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-700">Решено</Badge>;
      case "CLOSED":
        return <Badge className="bg-gray-100 text-gray-700">Закрыто</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!privacyConsent) {
      setSubmitError("Необходимо согласиться с политикой обработки персональных данных");
      return;
    }

    // Клиентская валидация
    if (formData.name.length < 2) {
      setSubmitError("Имя должно содержать минимум 2 символа");
      return;
    }
    if (formData.subject.length < 5) {
      setSubmitError("Тема должна содержать минимум 5 символов");
      return;
    }
    if (formData.message.length < 10) {
      setSubmitError("Сообщение должно содержать минимум 10 символов");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitSupportForm(formData);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setPrivacyConsent(false);
      // Перезагружаем обращения
      loadMyTickets();
    } catch (err) {
      console.error("Ошибка при отправке формы:", err);
      setSubmitError(err instanceof Error ? err.message : "Ошибка при отправке формы");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
        const faqData = await getFAQ();
        setFaqItems(faqData);
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Запускаем только один раз при монтировании

  // Fallback данные, если API недоступен
  const fallbackFaqItems = [
    {
      question: "Как зарегистрироваться в системе?",
      answer:
        "Нажмите кнопку 'Регистрация' в правом верхнем углу, заполните форму и подтвердите email.",
    },
    {
      question: "Как изменить язык интерфейса?",
      answer:
        "Используйте переключатель языка в навигационной панели для выбора предпочитаемого языка.",
    },
    {
      question: "Как создать напоминание?",
      answer:
        "Перейдите в раздел 'Напоминания', нажмите 'Добавить' и заполните необходимые поля.",
    },
    {
      question: "Как работает AI-помощник?",
      answer:
        "AI-помощник имеет 3 режима: Учёба (экзамены, курсовые), Жизнь (документы, адаптация), Генератор (тексты). Также доступны готовые шаблоны для курсовых, резюме, писем и заявлений.",
    },
    {
      question: "Как получить доступ к образовательным гайдам?",
      answer:
        "Все гайды доступны в разделах 'Учёба' и 'Быт' после регистрации в системе.",
    },
    {
      question: "Что делать, если забыл пароль?",
      answer:
        "На странице входа нажмите 'Забыли пароль?' и следуйте инструкциям для восстановления.",
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email поддержка",
      description: "support@adapted-russia.ru",
      response: "Ответ в течение 24 часов",
    },
    {
      icon: Phone,
      title: "Телефон",
      description: "+7 (800) 555-0123",
      response: "Пн-Пт 9:00-18:00 МСК",
    },
    {
      icon: MessageSquare,
      title: "Онлайн чат",
      description: "Доступен 24/7",
      response: "Мгновенный ответ",
    },
  ];

  // Skeleton при начальной загрузке
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button Skeleton */}
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mb-6"></div>

          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto"></div>
          </div>

          {/* Contact Methods Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Form and FAQ Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Skeleton */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* FAQ Skeleton */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-b border-gray-200 pb-4">
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isSubmitted ? (
          <div className="max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl mb-2">
                Сообщение отправлено!
              </CardTitle>
              <CardDescription className="text-lg">
                Спасибо за обращение. Мы ответим вам в ближайшее время.
              </CardDescription>
              <Button onClick={() => setIsSubmitted(false)} className="mt-6">
                Отправить еще одно сообщение
              </Button>
            </Card>
          </div>
        ) : (
          <>
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-6 hover:bg-blue-100"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>

            {/* Заголовок */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Служба поддержки
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Мы здесь, чтобы помочь вам с любыми вопросами по адаптации в
                России
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Форма обратной связи */}
              <div className="lg:col-span-2">
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Обратная связь
                    </CardTitle>
                    <CardDescription>
                      Отправьте нам сообщение, и мы ответим в ближайшее время
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
                            Имя *
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            minLength={2}
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Ваше имя (мин. 2 символа)"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Email *
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Тема *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          minLength={5}
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Кратко опишите проблему (мин. 5 символов)"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Сообщение *
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
                          placeholder="Подробно опишите ваш вопрос или проблему (мин. 10 символов)..."
                        />
                      </div>

                      {/* Ошибка */}
                      {submitError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {submitError}
                        </div>
                      )}

                      {/* Согласие с политикой обработки персональных данных */}
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
                          Отправляя сообщение, вы соглашаетесь с{" "}
                          <a
                            href="/privacy-policy"
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            политикой обработки персональных данных
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
                            Отправка...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Отправить сообщение
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Контактная информация */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Связаться с нами
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contactMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.title}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                        >
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
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Q&amp;A / живое общение
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Задавайте вопросы сообществу и подключайтесь к живым
                      сессиям с кураторами.
                    </p>
                    <Link href="/community/questions">
                      <Button className="w-full">Перейти в Q&amp;A</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Время работы
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Понедельник - Пятница:</span>
                        <span className="font-medium">9:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Суббота:</span>
                        <span className="font-medium">10:00 - 16:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Воскресенье:</span>
                        <span className="font-medium">Выходной</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Экстренная поддержка доступна 24/7
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ */}
            {/* Мои обращения */}
            {user && myTickets.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Inbox className="h-6 w-6 text-blue-600" />
                  Мои обращения
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
                                  • {ticket.responses.length} {ticket.responses.length === 1 ? "ответ" : "ответа"}
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
                          {/* Оригинальное сообщение */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-500 mb-1">Ваше сообщение:</p>
                            <p className="text-gray-700">{ticket.message}</p>
                          </div>

                          {/* Ответы */}
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
                                      {response.isAdmin ? "Поддержка" : "Вы"}
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
                              Ответов пока нет. Мы скоро свяжемся с вами!
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
                  Часто задаваемые вопросы
                </h2>
                <p className="text-gray-600">
                  Найдите ответы на самые популярные вопросы
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {(faqItems.length > 0 ? faqItems : fallbackFaqItems).map(
                  (item) => (
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

            {/* Дополнительная информация */}
            <div className="mt-16">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    Полезные ресурсы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium">Документация</h4>
                      <p className="text-sm text-gray-600">
                        Подробные инструкции
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium">Сообщество</h4>
                      <p className="text-sm text-gray-600">Форум студентов</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-purple-50">
                      <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium">Блог</h4>
                      <p className="text-sm text-gray-600">Полезные статьи</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-50">
                      <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium">Безопасность</h4>
                      <p className="text-sm text-gray-600">
                        Правила и рекомендации
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
