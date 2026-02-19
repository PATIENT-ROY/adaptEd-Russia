"use client";

import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { useTranslation } from "@/hooks/useTranslation";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  MessageSquare,
  Send,
  Bot,
  Lightbulb,
  BookOpen,
  Home,
  Clock,
  AlertCircle,
  Trash2,
  Mic,
  MicOff,
  GraduationCap,
  FileText,
  Briefcase,
  PenTool,
  HelpCircle,
  FileCheck,
  Calculator,
  Languages,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

// Типы режимов AI
type AIMode = "study" | "life" | "generator";

interface AIModeConfig {
  id: AIMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

const AI_MODES: AIModeConfig[] = [
  {
    id: "study",
    name: "Учёба",
    icon: GraduationCap,
    description: "Экзамены, курсовые, задачи",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "life",
    name: "Жизнь",
    icon: Home,
    description: "Адаптация, документы, быт",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  {
    id: "generator",
    name: "Генератор",
    icon: PenTool,
    description: "Тексты, письма, резюме",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
];

// Быстрые вопросы для каждого режима
const QUICK_QUESTIONS_BY_MODE: Record<AIMode, Array<{ id: string; question: string; icon: React.ComponentType<{ className?: string }> }>> = {
  study: [
    { id: "s1", question: "Помоги подготовиться к экзамену", icon: GraduationCap },
    { id: "s2", question: "Как писать курсовую работу?", icon: BookOpen },
    { id: "s3", question: "Объясни тему простыми словами", icon: HelpCircle },
    { id: "s4", question: "Помоги решить задачу", icon: Calculator },
  ],
  life: [
    { id: "l1", question: "Что делать при потере паспорта?", icon: AlertCircle },
    { id: "l2", question: "Как зарегистрироваться в общежитии?", icon: Home },
    { id: "l3", question: "Когда начинается сессия?", icon: Clock },
    { id: "l4", question: "Как оформить документы?", icon: FileCheck },
  ],
  generator: [
    { id: "g1", question: "Напиши план курсовой работы", icon: FileText },
    { id: "g2", question: "Составь резюме на русском", icon: Briefcase },
    { id: "g3", question: "Напиши письмо преподавателю", icon: PenTool },
    { id: "g4", question: "Переведи текст на русский", icon: Languages },
  ],
};

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onresult:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export default function AiHelperPage() {
  const { user } = useAuth();
  useTranslation();
  const { messages, loading, error, sendMessage, clearChat } = useChat(
    user?.id || ""
  );
  const [inputMessage, setInputMessage] = useState("");
  const [currentMode, setCurrentMode] = useState<AIMode>("study");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  const currentModeConfig = AI_MODES.find(m => m.id === currentMode) || AI_MODES[0];
  const quickQuestions = QUICK_QUESTIONS_BY_MODE[currentMode];

  // Автоматическая прокрутка к новым сообщениям
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Скролл только если есть сообщения (не при первой загрузке)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setSpeechError("Ваш браузер не поддерживает голосовой ввод");
      return;
    }

    const localeMap: Record<string, string> = {
      RU: "ru-RU",
      EN: "en-US",
      FR: "fr-FR",
      AR: "ar-SA",
      ZH: "zh-CN",
    };

    const recognition = new SpeechRecognition();
    recognition.lang = localeMap[(user?.language as string) ?? "RU"] || "ru-RU";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event);
      let message: string | null = null;
      switch (event?.error) {
        case "not-allowed":
        case "service-not-allowed":
          message =
            "Доступ к микрофону запрещён. Разрешите использование микрофона в браузере";
          break;
        case "network":
          message = "Проблема с сетью. Попробуйте позже";
          break;
        case "no-speech":
          message = "Не удалось распознать речь. Попробуйте ещё раз";
          break;
        case "aborted":
          message = null;
          break;
        default:
          message = "Не удалось включить голосовой ввод";
          break;
      }
      if (message) {
        setSpeechError(message);
      }
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        setInputMessage((prev) => {
          const separator = prev.trim() ? " " : "";
          return `${prev}${separator}${finalTranscript.trim()}`;
        });
      }
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
      setIsListening(false);
    };
  }, [user?.language]);

  const handleSendMessage = async () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    }

    if (!inputMessage.trim()) return;

    try {
      await sendMessage(inputMessage);
      setInputMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!isSpeechSupported || !recognitionRef.current || loading) return;

    try {
      setSpeechError(null);
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Speech recognition start/stop error:", err);
      setIsListening(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    try {
      await sendMessage(question);
    } catch (err) {
      console.error("Error sending quick question:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Chat Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="xl:col-span-3">
                <div className="bg-white rounded-2xl sm:rounded-3xl min-h-[500px] p-6 shadow-sm">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 bg-gray-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header с режимами */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className={`rounded-lg p-3 w-fit ${currentModeConfig.bgColor}`}>
                  <currentModeConfig.icon className={`h-6 w-6 ${currentModeConfig.color}`} />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    AI Помощник — {currentModeConfig.name}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {currentModeConfig.description}
                  </p>
                </div>
                <Link
                  href="/templates"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Шаблоны
                </Link>
              </div>
              
              {/* Переключатель режимов */}
              <div className="flex flex-wrap gap-2">
                {AI_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setCurrentMode(mode.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all ${
                        isActive
                          ? `${mode.bgColor} ${mode.color} border-current`
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Chat Section */}
            <div className="xl:col-span-3 order-2 xl:order-1">
              <Card className="min-h-[400px] sm:min-h-[500px] h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] lg:h-[calc(100vh-400px)] flex flex-col">
                <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        currentMode === "study" ? "bg-gradient-to-br from-blue-500 to-blue-600" :
                        currentMode === "life" ? "bg-gradient-to-br from-green-500 to-green-600" :
                        "bg-gradient-to-br from-purple-500 to-pink-600"
                      }`}>
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">
                          AI {currentModeConfig.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {currentModeConfig.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearChat}
                      className="text-red-600 hover:text-red-700 w-fit"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Очистить</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 scroll-smooth"
                  >
                    {error && (
                      <div className="flex justify-center">
                        <div className="bg-red-50 border border-red-200 rounded-2xl px-3 sm:px-4 py-3 max-w-md">
                          <p className="text-red-600 text-xs sm:text-sm text-center">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title="Начните разговор"
                        description="Задайте вопрос AI-помощнику о жизни и учёбе в России"
                      />
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 break-words ${
                                message.isUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                                {!message.isUser && (
                                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                )}
                                <span className="text-xs opacity-70 flex-shrink-0">
                                  {message.timestamp
                                    ? new Date(
                                        message.timestamp
                                      ).toLocaleTimeString("ru-RU", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : new Date().toLocaleTimeString("ru-RU", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </span>
                              </div>
                              <div className="prose prose-sm max-w-none text-sm sm:text-base">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children, ...props }: React.ComponentProps<'p'>) => (
                                      <p
                                        className="mb-1 sm:mb-2 last:mb-0"
                                        {...props}
                                      >
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
                                      <ul
                                        className="list-disc list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1"
                                        {...props}
                                      >
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
                                      <ol
                                        className="list-decimal list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1"
                                        {...props}
                                      >
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children, ...props }: React.ComponentProps<'li'>) => (
                                      <li
                                        className="text-xs sm:text-sm"
                                        {...props}
                                      >
                                        {children}
                                      </li>
                                    ),
                                    strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
                                      <strong
                                        className="font-semibold"
                                        {...props}
                                      >
                                        {children}
                                      </strong>
                                    ),
                                  } as React.ComponentProps<typeof ReactMarkdown>['components']}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                          <LoadingSpinner size="sm" text="AI печатает..." />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-3 sm:p-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Задайте вопрос..."
                        className="flex-1 text-sm sm:text-base"
                        disabled={loading}
                      />
                      {isSpeechSupported ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={toggleSpeechRecognition}
                          disabled={loading}
                          className={`h-10 w-10 rounded-full border-slate-200 transition-colors flex-shrink-0 ${
                            isListening
                              ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                          aria-label={
                            isListening
                              ? "Остановить запись"
                              : "Продиктовать вопрос"
                          }
                          title={
                            isListening
                              ? "Остановить запись"
                              : "Продиктовать вопрос"
                          }
                        >
                          {isListening ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled
                          className="h-10 w-10 rounded-full border-slate-200 text-slate-400 flex-shrink-0"
                          aria-label="Голосовой ввод недоступен"
                          title="Голосовой ввод недоступен в этом браузере"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={handleSendMessage}
                        disabled={loading || !inputMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-shrink-0"
                        size="sm"
                        aria-label="Отправить сообщение"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {speechError && (
                    <p className="mt-2 text-xs text-red-500 text-center">
                      {speechError}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Questions */}
            <div className="space-y-4 sm:space-y-6 order-1 xl:order-2">
              <Card className={`border-2 ${currentModeConfig.bgColor}`}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className={`flex items-center space-x-2 text-lg sm:text-xl ${currentModeConfig.color}`}>
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>Быстрые вопросы</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600">
                    {currentMode === "study" && "Вопросы про учёбу и экзамены"}
                    {currentMode === "life" && "Вопросы про жизнь в России"}
                    {currentMode === "generator" && "Шаблоны для генерации"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {quickQuestions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`w-full border rounded-lg p-4 sm:p-5 bg-white hover:shadow-sm transition-all duration-200 cursor-pointer ${
                          loading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-[1.02]"
                        } ${
                          currentMode === "study" ? "border-blue-200 hover:bg-blue-50" :
                          currentMode === "life" ? "border-green-200 hover:bg-green-50" :
                          "border-purple-200 hover:bg-purple-50"
                        }`}
                        onClick={() =>
                          !loading && handleQuickQuestion(item.question)
                        }
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${currentModeConfig.color}`} />
                          <span className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                            {item.question}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Mode-specific Tips */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span>Советы</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
                  {currentMode === "study" && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Спрашивайте объяснения тем простыми словами</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Просите примеры задач и решения</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">AI поможет с планом курсовой работы</p>
                      </div>
                    </>
                  )}
                  {currentMode === "life" && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Спрашивайте о документах и регистрации</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Получайте советы по адаптации</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Узнавайте о местных правилах и культуре</p>
                      </div>
                    </>
                  )}
                  {currentMode === "generator" && (
                    <>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Указывайте тему и требования</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">Просите исправления и улучшения</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                        <p className="leading-relaxed">
                          <Link href="/templates" className="text-purple-600 hover:underline font-medium">
                            Используйте шаблоны
                          </Link>
                          {" "}для структурированных текстов
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
