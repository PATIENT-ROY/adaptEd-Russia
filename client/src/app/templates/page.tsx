"use client";

import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  FileText,
  BookOpen,
  Briefcase,
  PenTool,
  Mail,
  GraduationCap,
  FileCheck,
  Languages,
  ArrowLeft,
  Send,
  CheckCircle,
  Copy,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  fields: TemplateField[];
  promptBuilder: (values: Record<string, string>) => string;
}

const TEMPLATES: Template[] = [
  {
    id: "coursework-plan",
    name: "План курсовой работы",
    description: "Структурированный план с главами и разделами",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    fields: [
      { id: "topic", label: "Тема работы", placeholder: "Например: Влияние социальных сетей на молодёжь", type: "text", required: true },
      { id: "subject", label: "Предмет/дисциплина", placeholder: "Например: Социология", type: "text", required: true },
      { id: "pages", label: "Объём (страниц)", placeholder: "Например: 30", type: "text" },
      { id: "requirements", label: "Дополнительные требования", placeholder: "Особые требования преподавателя", type: "textarea" },
    ],
    promptBuilder: (values) => `Создай подробный план курсовой работы:

Тема: ${values.topic}
Предмет: ${values.subject}
${values.pages ? `Объём: ${values.pages} страниц` : ""}
${values.requirements ? `Требования: ${values.requirements}` : ""}

Пожалуйста, создай структурированный план с:
1. Введением (актуальность, цели, задачи)
2. Главами и параграфами с описанием содержания
3. Заключением
4. Примерным списком литературы

Формат: используй нумерацию и подзаголовки.`,
  },
  {
    id: "resume",
    name: "Резюме на русском",
    description: "Профессиональное резюме для работы в России",
    icon: Briefcase,
    color: "text-green-600",
    bgColor: "bg-green-50",
    fields: [
      { id: "name", label: "ФИО", placeholder: "Иванов Иван Иванович", type: "text", required: true },
      { id: "position", label: "Желаемая должность", placeholder: "Например: Junior разработчик", type: "text", required: true },
      { id: "education", label: "Образование", placeholder: "Университет, специальность, год окончания", type: "textarea", required: true },
      { id: "experience", label: "Опыт работы (если есть)", placeholder: "Компании, должности, обязанности", type: "textarea" },
      { id: "skills", label: "Навыки", placeholder: "Языки программирования, soft skills и т.д.", type: "textarea", required: true },
      { id: "languages", label: "Языки", placeholder: "Русский (B2), Английский (C1)", type: "text" },
    ],
    promptBuilder: (values) => `Создай профессиональное резюме на русском языке:

ФИО: ${values.name}
Желаемая должность: ${values.position}
Образование: ${values.education}
${values.experience ? `Опыт работы: ${values.experience}` : "Без опыта работы"}
Навыки: ${values.skills}
${values.languages ? `Языки: ${values.languages}` : ""}

Создай структурированное резюме в профессиональном стиле. Используй чёткие формулировки и акцентируй достижения.`,
  },
  {
    id: "teacher-email",
    name: "Письмо преподавателю",
    description: "Официальное письмо с просьбой или вопросом",
    icon: Mail,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    fields: [
      { id: "teacher_name", label: "ФИО преподавателя", placeholder: "Иванов Иван Иванович", type: "text", required: true },
      { id: "subject", label: "Предмет", placeholder: "Название дисциплины", type: "text" },
      { id: "purpose", label: "Цель письма", placeholder: "Например: Просьба о пересдаче экзамена", type: "text", required: true },
      { id: "details", label: "Подробности", placeholder: "Опишите ситуацию подробнее", type: "textarea", required: true },
      { id: "your_name", label: "Ваше ФИО", placeholder: "Ваше полное имя", type: "text", required: true },
      { id: "group", label: "Группа", placeholder: "Номер группы", type: "text" },
    ],
    promptBuilder: (values) => `Напиши официальное письмо преподавателю:

Кому: ${values.teacher_name}
${values.subject ? `Предмет: ${values.subject}` : ""}
Цель: ${values.purpose}
Подробности: ${values.details}
От: ${values.your_name}
${values.group ? `Группа: ${values.group}` : ""}

Напиши вежливое и корректное письмо в официальном стиле. Используй уважительное обращение и соблюдай деловой этикет.`,
  },
  {
    id: "essay",
    name: "Эссе",
    description: "Структурированное эссе на заданную тему",
    icon: PenTool,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    fields: [
      { id: "topic", label: "Тема эссе", placeholder: "Введите тему эссе", type: "text", required: true },
      { id: "subject", label: "Предмет", placeholder: "Для какого предмета", type: "text" },
      { id: "length", label: "Объём (слов)", placeholder: "Например: 500", type: "text" },
      { id: "style", label: "Стиль", placeholder: "Академический, публицистический...", type: "text" },
      { id: "thesis", label: "Ваш тезис/мнение (опционально)", placeholder: "Ваша позиция по теме", type: "textarea" },
    ],
    promptBuilder: (values) => `Напиши эссе:

Тема: ${values.topic}
${values.subject ? `Предмет: ${values.subject}` : ""}
${values.length ? `Объём: около ${values.length} слов` : ""}
${values.style ? `Стиль: ${values.style}` : "Стиль: академический"}
${values.thesis ? `Тезис автора: ${values.thesis}` : ""}

Создай структурированное эссе с введением, основной частью и заключением. Используй аргументы и примеры.`,
  },
  {
    id: "application",
    name: "Заявление",
    description: "Официальное заявление в деканат или администрацию",
    icon: FileCheck,
    color: "text-red-600",
    bgColor: "bg-red-50",
    fields: [
      { id: "recipient", label: "Кому (должность)", placeholder: "Декану факультета...", type: "text", required: true },
      { id: "recipient_name", label: "ФИО получателя", placeholder: "Иванов И.И.", type: "text" },
      { id: "purpose", label: "Цель заявления", placeholder: "Прошу предоставить академический отпуск...", type: "textarea", required: true },
      { id: "reason", label: "Причина/основание", placeholder: "По причине...", type: "textarea" },
      { id: "your_name", label: "Ваше ФИО", placeholder: "Полное имя", type: "text", required: true },
      { id: "faculty", label: "Факультет", placeholder: "Название факультета", type: "text" },
      { id: "group", label: "Группа/курс", placeholder: "Номер группы, курс", type: "text" },
    ],
    promptBuilder: (values) => `Напиши официальное заявление:

Кому: ${values.recipient}${values.recipient_name ? ` ${values.recipient_name}` : ""}
Цель: ${values.purpose}
${values.reason ? `Причина: ${values.reason}` : ""}
От кого: ${values.your_name}
${values.faculty ? `Факультет: ${values.faculty}` : ""}
${values.group ? `Группа/курс: ${values.group}` : ""}

Создай официальное заявление по стандартной форме. Соблюдай деловой стиль и правильное оформление.`,
  },
  {
    id: "translation",
    name: "Перевод текста",
    description: "Качественный перевод на русский язык",
    icon: Languages,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    fields: [
      { id: "source_lang", label: "Исходный язык", placeholder: "Английский, французский...", type: "text", required: true },
      { id: "text", label: "Текст для перевода", placeholder: "Вставьте текст", type: "textarea", required: true },
      { id: "style", label: "Стиль перевода", placeholder: "Официальный, разговорный, академический", type: "text" },
      { id: "context", label: "Контекст (опционально)", placeholder: "Для чего этот перевод", type: "text" },
    ],
    promptBuilder: (values) => `Переведи текст на русский язык:

Исходный язык: ${values.source_lang}
${values.style ? `Стиль: ${values.style}` : ""}
${values.context ? `Контекст: ${values.context}` : ""}

Текст:
${values.text}

Сделай качественный перевод, сохраняя смысл и стиль оригинала. Используй естественные русские выражения.`,
  },
  {
    id: "presentation-outline",
    name: "План презентации",
    description: "Структура презентации со слайдами",
    icon: GraduationCap,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    fields: [
      { id: "topic", label: "Тема презентации", placeholder: "О чём презентация", type: "text", required: true },
      { id: "subject", label: "Предмет/курс", placeholder: "Для какого предмета", type: "text" },
      { id: "slides", label: "Количество слайдов", placeholder: "Например: 10", type: "text" },
      { id: "duration", label: "Длительность (минут)", placeholder: "Например: 15", type: "text" },
      { id: "audience", label: "Аудитория", placeholder: "Студенты, преподаватели...", type: "text" },
    ],
    promptBuilder: (values) => `Создай план презентации:

Тема: ${values.topic}
${values.subject ? `Предмет: ${values.subject}` : ""}
${values.slides ? `Количество слайдов: ${values.slides}` : ""}
${values.duration ? `Длительность: ${values.duration} минут` : ""}
${values.audience ? `Аудитория: ${values.audience}` : ""}

Создай подробный план презентации с:
1. Названием каждого слайда
2. Ключевыми тезисами для каждого слайда
3. Рекомендациями по визуальному оформлению
4. Примерным текстом для спикера`,
  },
];

export default function TemplatesPage() {
  const { user } = useAuth();
  const { sendMessage, loading } = useChat(user?.id || "");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormValues({});
    setGeneratedContent(null);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    const requiredFields = selectedTemplate.fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !formValues[f.id]?.trim());

    if (missingFields.length > 0) {
      alert(`Пожалуйста, заполните обязательные поля: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = selectedTemplate.promptBuilder(formValues);
      const response = await sendMessage(prompt);
      
      // response может быть в формате { aiMessage: {...} } или { id, content, ... }
      interface ChatResponse {
        aiMessage?: { content: string };
        content?: string;
      }
      
      if (response) {
        const chatResponse = response as ChatResponse;
        if (chatResponse.aiMessage?.content) {
          setGeneratedContent(chatResponse.aiMessage.content);
        } else if (chatResponse.content) {
          setGeneratedContent(chatResponse.content);
        }
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Ошибка при генерации. Попробуйте ещё раз.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    handleGenerate();
  };

  const handleBack = () => {
    if (generatedContent) {
      setGeneratedContent(null);
    } else {
      setSelectedTemplate(null);
      setFormValues({});
    }
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {(selectedTemplate || generatedContent) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {selectedTemplate ? selectedTemplate.name : "Шаблоны для генерации"}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      {selectedTemplate
                        ? selectedTemplate.description
                        : "Готовые формы для создания текстов с помощью AI"}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/ai-helper"
                className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                AI Помощник
              </Link>
            </div>
          </div>

          {/* Content */}
          {!selectedTemplate ? (
            /* Template Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 hover:border-current ${template.bgColor}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl ${template.bgColor} flex items-center justify-center mb-3`}>
                        <Icon className={`h-6 w-6 ${template.color}`} />
                      </div>
                      <CardTitle className={`text-lg ${template.color}`}>
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{template.fields.length} полей для заполнения</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : !generatedContent ? (
            /* Form */
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${selectedTemplate.bgColor} flex items-center justify-center`}>
                    <selectedTemplate.icon className={`h-5 w-5 ${selectedTemplate.color}`} />
                  </div>
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>Заполните поля для генерации</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={formValues[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isGenerating || loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Генерация...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Сгенерировать
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Result */
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Результат генерации</CardTitle>
                      <CardDescription>{selectedTemplate.name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className={copied ? "text-green-600" : ""}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Копировать
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating || loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                      Заново
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 sm:p-6">
                  <ReactMarkdown
                    components={{
                      p: ({ children, ...props }: React.ComponentProps<'p'>) => (
                        <p className="mb-3 last:mb-0" {...props}>
                          {children}
                        </p>
                      ),
                      ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
                        <ul className="list-disc list-inside mb-3 space-y-1" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>
                          {children}
                        </ol>
                      ),
                      h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
                        <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" {...props}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
                        <h2 className="text-lg font-bold mb-2 mt-4" {...props}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
                        <h3 className="text-base font-bold mb-2 mt-3" {...props}>
                          {children}
                        </h3>
                      ),
                      strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
                        <strong className="font-semibold" {...props}>
                          {children}
                        </strong>
                      ),
                    } as React.ComponentProps<typeof ReactMarkdown>['components']}
                  >
                    {generatedContent}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
