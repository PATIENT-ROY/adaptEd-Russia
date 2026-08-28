"use client";

import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
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
  Send,
  CheckCircle,
  Copy,
  RefreshCw,
  Bot,
  X,
  Pencil,
  Presentation,
  Puzzle,
  Mic2,
  ClipboardCheck,
  ArrowRight,
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
  category: TemplateCategory;
  fields: TemplateField[];
  promptBuilder: (values: Record<string, string>) => string;
}

type TemplateCategory = "text" | "presentation" | "tasks" | "topic" | "exams" | "transcript";

const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategory;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}> = [
  { id: "text", name: "Текстовая работа", description: "Эссе, письма и документы", icon: FileText, gradient: "from-blue-500 to-blue-700" },
  { id: "presentation", name: "Презентация", description: "План слайдов и выступления", icon: Presentation, gradient: "from-orange-500 to-red-500" },
  { id: "tasks", name: "Решение задач", description: "Разбор с объяснением", icon: Puzzle, gradient: "from-pink-400 to-pink-600" },
  { id: "topic", name: "Изучение темы", description: "План и понятный конспект", icon: GraduationCap, gradient: "from-red-500 to-rose-600" },
  { id: "exams", name: "Экзамены", description: "Подготовка и самопроверка", icon: ClipboardCheck, gradient: "from-emerald-400 to-teal-500" },
  { id: "transcript", name: "Транскрибатор", description: "Очистка записи в конспект", icon: Mic2, gradient: "from-fuchsia-500 to-purple-600" },
];

const TEMPLATES: Template[] = [
  {
    id: "coursework-plan",
    name: "План курсовой работы",
    description: "Структурированный план с главами и разделами",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    category: "topic",
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
    category: "text",
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
    category: "text",
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
    category: "text",
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
    category: "text",
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
    category: "transcript",
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
    category: "presentation",
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
  {
    id: "solve-task", name: "Разобрать задачу", description: "Решение по шагам с объяснением логики", icon: Puzzle,
    color: "text-pink-600", bgColor: "bg-pink-50", category: "tasks",
    fields: [
      { id: "subject", label: "Предмет", placeholder: "Математика, физика, экономика…", type: "text", required: true },
      { id: "task", label: "Условие задачи", placeholder: "Вставьте полное условие", type: "textarea", required: true },
      { id: "level", label: "Ваш уровень", placeholder: "1 курс, бакалавриат…", type: "text" },
    ],
    promptBuilder: (v) => `Реши задачу по предмету «${v.subject}».\n\nУсловие: ${v.task}\n${v.level ? `Уровень: ${v.level}` : ""}\n\nОбъясни каждый шаг простыми словами, проверь ответ и в конце дай краткий алгоритм решения подобных задач.`,
  },
  {
    id: "study-topic", name: "Изучить тему", description: "Понятный конспект и план изучения", icon: GraduationCap,
    color: "text-rose-600", bgColor: "bg-rose-50", category: "topic",
    fields: [
      { id: "topic", label: "Тема", placeholder: "Например: производные функций", type: "text", required: true },
      { id: "level", label: "Текущий уровень", placeholder: "Не знаком / знаю основы", type: "text" },
      { id: "goal", label: "Цель", placeholder: "Понять к семинару, подготовиться к тесту…", type: "text" },
    ],
    promptBuilder: (v) => `Помоги изучить тему «${v.topic}». ${v.level ? `Мой уровень: ${v.level}.` : ""} ${v.goal ? `Цель: ${v.goal}.` : ""}\n\nОбъясни от простого к сложному, приведи примеры, составь краткий конспект и 5 вопросов для самопроверки.`,
  },
  {
    id: "exam-prep", name: "Подготовка к экзамену", description: "План подготовки, билеты и проверка знаний", icon: ClipboardCheck,
    color: "text-emerald-600", bgColor: "bg-emerald-50", category: "exams",
    fields: [
      { id: "subject", label: "Предмет", placeholder: "Название дисциплины", type: "text", required: true },
      { id: "topics", label: "Темы или билеты", placeholder: "Перечислите темы экзамена", type: "textarea", required: true },
      { id: "days", label: "Дней до экзамена", placeholder: "Например: 7", type: "text" },
    ],
    promptBuilder: (v) => `Подготовь меня к экзамену по предмету «${v.subject}».\nТемы: ${v.topics}\n${v.days ? `До экзамена: ${v.days} дней.` : ""}\n\nСоставь реалистичный план, краткую шпаргалку по темам и тренировочный тест с ответами.`,
  },
  {
    id: "lecture-transcript", name: "Конспект из расшифровки", description: "Превращает сырой текст записи в конспект", icon: Mic2,
    color: "text-fuchsia-600", bgColor: "bg-fuchsia-50", category: "transcript",
    fields: [
      { id: "title", label: "Тема лекции", placeholder: "Название темы", type: "text" },
      { id: "text", label: "Расшифровка", placeholder: "Вставьте текст аудио или лекции", type: "textarea", required: true },
      { id: "format", label: "Формат результата", placeholder: "Подробный конспект / краткие тезисы", type: "text" },
    ],
    promptBuilder: (v) => `Обработай расшифровку ${v.title ? `лекции «${v.title}»` : "лекции"}.\n\n${v.text}\n\nУдали повторы и слова-паразиты, исправь явные ошибки распознавания и оформи ${v.format || "структурированный конспект"}. Не добавляй факты, которых нет в исходном тексте.`,
  },
];

type Step = "choose" | "fill" | "result";

function StepIndicator({ current, t }: { current: Step; t: (key: string) => string }) {
  const steps: { key: Step; label: string }[] = [
    { key: "choose", label: t("templates.step.choose") },
    { key: "fill", label: t("templates.step.fill") },
    { key: "result", label: t("templates.step.result") },
  ];
  const currentIndex = steps.findIndex(s => s.key === current);

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-3" aria-label="Progress">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-1.5">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i <= currentIndex
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}>
              {i < currentIndex ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${
              i <= currentIndex ? "text-purple-700" : "text-gray-400"
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 ${
              i < currentIndex ? "bg-purple-600" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AiToolsExperience() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | null>(null);
  const unauthFallback = (
    <FeaturePreviewGate
      featureName="AI-инструменты"
      previewTitle="Готовый AI-инструмент"
      previewText='После входа выберите задачу и получите готовый результат, например: "Письмо преподавателю о переносе дедлайна".'
    />
  );

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const currentStep: Step = !selectedTemplate ? "choose" : !generatedContent ? "fill" : "result";

  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setFormValues({});
    setGeneratedContent(null);
    setFieldErrors(new Set());
  }, []);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate) return;

    const requiredFields = selectedTemplate.fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !formValues[f.id]?.trim());

    if (missing.length > 0) {
      setFieldErrors(new Set(missing.map(f => f.id)));
      showToast(t("templates.requiredError"), "error");
      return;
    }

    setFieldErrors(new Set());
    setIsGenerating(true);
    try {
      const prompt = selectedTemplate.promptBuilder(formValues);
      const response = await apiClient.sendMessage(prompt, "generator");

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
      showToast(t("templates.generateError"), "error");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, formValues, showToast, t]);

  const handleCopy = useCallback(async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      showToast(t("templates.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }, [generatedContent, showToast, t]);

  const handleRegenerate = useCallback(() => {
    setGeneratedContent(null);
    handleGenerate();
  }, [handleGenerate]);

  const handleBack = useCallback(() => {
    if (generatedContent) {
      setGeneratedContent(null);
    } else {
      setSelectedTemplate(null);
      setFormValues({});
      setFieldErrors(new Set());
    }
  }, [generatedContent]);

  const handleEditFromResult = useCallback(() => {
    setGeneratedContent(null);
  }, []);

  if (!user) {
    return (
      <ProtectedRoute fallback={unauthFallback}>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute fallback={unauthFallback}>
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <BackButton
              label={selectedTemplate || generatedContent ? t("templates.back") : "Все AI-возможности"}
              href={selectedTemplate || generatedContent ? undefined : "/ai-helper"}
              onClick={selectedTemplate || generatedContent ? handleBack : undefined}
            />
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {selectedTemplate ? selectedTemplate.name : t("templates.page.title")}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      {selectedTemplate
                        ? selectedTemplate.description
                        : t("templates.page.subtitle")}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/ai-helper/assistant"
                className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                <Bot className="h-4 w-4 mr-2 text-blue-600" />
                {t("templates.aiHelper")}
              </Link>
            </div>

            {/* Step Indicator */}
            {selectedTemplate && (
              <StepIndicator current={currentStep} t={t} />
            )}
          </div>

          {/* Content */}
          {!selectedTemplate ? (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">Быстрый старт</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Что хотите создать?</h2>
                  </div>
                  {activeCategory && <button onClick={() => setActiveCategory(null)} className="text-sm font-medium text-slate-500 hover:text-purple-600">Показать все</button>}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {TEMPLATE_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const active = activeCategory === category.id;
                    return <button key={category.id} onClick={() => setActiveCategory(active ? null : category.id)} className={`group rounded-2xl border p-3 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${active ? "border-purple-400 bg-purple-50 ring-2 ring-purple-100" : "border-slate-100 bg-white"}`}>
                      <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} text-white shadow-lg transition-transform group-hover:scale-105`}><Icon className="h-7 w-7" /></div>
                      <div className="font-bold leading-tight text-slate-900">{category.name}</div>
                      <div className="mt-1 hidden text-xs leading-snug text-slate-500 sm:block">{category.description}</div>
                    </button>;
                  })}
                </div>
              </section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{activeCategory ? TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.name : "Все AI-инструменты"}</h2>
                <span className="text-sm text-slate-500">{TEMPLATES.filter(t => !activeCategory || t.category === activeCategory).length} вариантов</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {TEMPLATES.filter(t => !activeCategory || t.category === activeCategory).map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`text-left w-full h-full rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${template.bgColor} hover:border-current p-0 cursor-pointer`}
                  >
                    <Card className="border-0 bg-transparent shadow-none h-full flex flex-col">
                      <CardHeader className="flex-1">
                        <div className={`w-12 h-12 rounded-xl ${template.bgColor} flex items-center justify-center mb-3`}>
                          <Icon className={`h-6 w-6 ${template.color}`} />
                        </div>
                        <CardTitle className={`text-lg ${template.color}`}>
                          {template.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {template.fields.filter(f => f.required).length} / {template.fields.length} {t("templates.fieldsCount")}
                          </span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
              </div>
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
                    <CardDescription>{t("templates.fillFields")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <fieldset disabled={isGenerating}>
                  {selectedTemplate.fields.map((field) => {
                    const hasError = fieldErrors.has(field.id);
                    const fieldId = `field-${field.id}`;
                    return (
                      <div key={field.id} className="space-y-1.5 mb-4 last:mb-0">
                        <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            id={fieldId}
                            className={`w-full min-h-[100px] px-3 py-2 text-sm rounded-md border bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
                              hasError
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "border-input"
                            }`}
                            placeholder={field.placeholder}
                            value={formValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={fieldId}
                            placeholder={field.placeholder}
                            value={formValues[field.id] || ""}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={hasError ? "border-red-500 focus-visible:ring-red-500" : ""}
                          />
                        )}
                        {hasError && (
                          <p className="text-xs text-red-500" role="alert">
                            {field.label} — обязательное поле
                          </p>
                        )}
                      </div>
                    );
                  })}
                </fieldset>

                <div className="pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {t("templates.generating")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("templates.generate")}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>{t("templates.result.title")}</CardTitle>
                      <CardDescription>{selectedTemplate.name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditFromResult}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("templates.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className={copied ? "text-green-600" : ""}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("templates.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t("templates.copy")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                      {t("templates.regenerate")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 sm:p-6">
                  <ReactMarkdown
                    components={{
                      p: ({ children, ...props }: React.ComponentProps<'p'>) => (
                        <p className="mb-3 last:mb-0" {...props}>{children}</p>
                      ),
                      ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
                        <ul className="list-disc list-inside mb-3 space-y-1" {...props}>{children}</ul>
                      ),
                      ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>{children}</ol>
                      ),
                      h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
                        <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" {...props}>{children}</h1>
                      ),
                      h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
                        <h2 className="text-lg font-bold mb-2 mt-4" {...props}>{children}</h2>
                      ),
                      h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
                        <h3 className="text-base font-bold mb-2 mt-3" {...props}>{children}</h3>
                      ),
                      strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
                        <strong className="font-semibold" {...props}>{children}</strong>
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

        {/* Toast */}
        {toastMessage && (
          <div className={`fixed left-1/2 top-20 z-[110] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-in items-center gap-2 rounded-xl px-6 py-3 text-sm shadow-2xl slide-in-from-top-4 duration-300 ${
            toastType === "error"
              ? "bg-red-600 text-white"
              : "bg-slate-900 text-white"
          }`}>
            {toastType === "error" ? (
              <X className="h-4 w-4 text-red-200 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
            )}
            {toastMessage}
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
