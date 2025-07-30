"use client";

import { useState, useEffect } from "react";
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
import type { FAQItem } from "@/types";
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
} from "lucide-react";

export default function SupportPage() {
  const { submitSupportForm, getFAQ, getContactInfo } = useSupport();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitSupportForm(formData);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Ошибка при отправке формы:", err);
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
      }
    };

    loadData();
  }, [getFAQ, getContactInfo]);

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
        "AI-помощник отвечает на ваши вопросы об адаптации в России. Просто введите вопрос в чате.",
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Служба поддержки
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Мы здесь, чтобы помочь вам с любыми вопросами по адаптации в России
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
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ваше имя"
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
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Кратко опишите проблему"
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
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Подробно опишите ваш вопрос или проблему..."
                    />
                  </div>

                  {/* Согласие с политикой обработки персональных данных */}
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="h-4 w-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-800">
                      Отправляя сообщение, вы соглашаетесь с{" "}
                      <a
                        href="/privacy-policy"
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        политикой обработки персональных данных
                      </a>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
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
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={index}
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
              (item, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
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
              <CardTitle className="text-center">Полезные ресурсы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Документация</h4>
                  <p className="text-sm text-gray-600">Подробные инструкции</p>
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
      </div>
    </div>
  );
}
