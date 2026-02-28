"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Check,
  Copy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

type AIMode = "study" | "life" | "generator";

interface AIModeConfig {
  id: AIMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

const MODE_ICONS: Record<AIMode, React.ComponentType<{ className?: string }>> = {
  study: GraduationCap,
  life: Home,
  generator: PenTool,
};

const MODE_STYLES: Record<AIMode, { color: string; bgColor: string }> = {
  study: { color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  life: { color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  generator: { color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
};

const QUICK_QUESTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  s1: GraduationCap, s2: BookOpen, s3: HelpCircle, s4: Calculator,
  l1: AlertCircle, l2: Home, l3: Clock, l4: FileCheck,
  g1: FileText, g2: Briefcase, g3: PenTool, g4: Languages,
};

const TIP_COLORS: Record<AIMode, string> = {
  study: "bg-blue-500",
  life: "bg-green-500",
  generator: "bg-purple-500",
};

const BORDER_COLORS: Record<AIMode, string> = {
  study: "border-blue-200 hover:bg-blue-50",
  life: "border-green-200 hover:bg-green-50",
  generator: "border-purple-200 hover:bg-purple-50",
};

const GRADIENT_COLORS: Record<AIMode, string> = {
  study: "bg-gradient-to-br from-blue-500 to-blue-600",
  life: "bg-gradient-to-br from-green-500 to-green-600",
  generator: "bg-gradient-to-br from-purple-500 to-pink-600",
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
      aria-label={label}
      title={label}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-gray-400" />
      )}
    </button>
  );
}

export default function AiHelperPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { messages, loading, error, isInitializing, sendMessage, clearChat } = useChat(
    user?.id || ""
  );
  const [inputMessage, setInputMessage] = useState("");
  const [currentMode, setCurrentMode] = useState<AIMode>("study");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const initialLoadDoneRef = useRef(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const aiModes = useMemo<AIModeConfig[]>(() => [
    {
      id: "study",
      name: t("aiHelper.mode.study"),
      icon: MODE_ICONS.study,
      description: t("aiHelper.mode.study.desc"),
      ...MODE_STYLES.study,
    },
    {
      id: "life",
      name: t("aiHelper.mode.life"),
      icon: MODE_ICONS.life,
      description: t("aiHelper.mode.life.desc"),
      ...MODE_STYLES.life,
    },
    {
      id: "generator",
      name: t("aiHelper.mode.generator"),
      icon: MODE_ICONS.generator,
      description: t("aiHelper.mode.generator.desc"),
      ...MODE_STYLES.generator,
    },
  ], [t]);

  const quickQuestionsByMode = useMemo(() => ({
    study: [
      { id: "s1", question: t("aiHelper.quickQuestions.study.1"), icon: QUICK_QUESTION_ICONS.s1 },
      { id: "s2", question: t("aiHelper.quickQuestions.study.2"), icon: QUICK_QUESTION_ICONS.s2 },
      { id: "s3", question: t("aiHelper.quickQuestions.study.3"), icon: QUICK_QUESTION_ICONS.s3 },
      { id: "s4", question: t("aiHelper.quickQuestions.study.4"), icon: QUICK_QUESTION_ICONS.s4 },
    ],
    life: [
      { id: "l1", question: t("aiHelper.quickQuestions.life.1"), icon: QUICK_QUESTION_ICONS.l1 },
      { id: "l2", question: t("aiHelper.quickQuestions.life.2"), icon: QUICK_QUESTION_ICONS.l2 },
      { id: "l3", question: t("aiHelper.quickQuestions.life.3"), icon: QUICK_QUESTION_ICONS.l3 },
      { id: "l4", question: t("aiHelper.quickQuestions.life.4"), icon: QUICK_QUESTION_ICONS.l4 },
    ],
    generator: [
      { id: "g1", question: t("aiHelper.quickQuestions.generator.1"), icon: QUICK_QUESTION_ICONS.g1 },
      { id: "g2", question: t("aiHelper.quickQuestions.generator.2"), icon: QUICK_QUESTION_ICONS.g2 },
      { id: "g3", question: t("aiHelper.quickQuestions.generator.3"), icon: QUICK_QUESTION_ICONS.g3 },
      { id: "g4", question: t("aiHelper.quickQuestions.generator.4"), icon: QUICK_QUESTION_ICONS.g4 },
    ],
  }), [t]);

  const currentModeConfig = aiModes.find(m => m.id === currentMode) || aiModes[0];
  const quickQuestions = quickQuestionsByMode[currentMode];

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      setTimeout(scrollToBottom, 100);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Scroll to bottom after initial history load
  useEffect(() => {
    if (!isInitializing && messages.length > 0 && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      setTimeout(scrollToBottom, 150);
    }
  }, [isInitializing, messages.length, scrollToBottom]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition ||
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setSpeechError(t("aiHelper.speech.notSupported"));
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
          message = t("aiHelper.speech.micDenied");
          break;
        case "network":
          message = t("aiHelper.speech.network");
          break;
        case "no-speech":
          message = t("aiHelper.speech.noSpeech");
          break;
        case "aborted":
          message = null;
          break;
        default:
          message = t("aiHelper.speech.generic");
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
        // ignore
      }
      recognitionRef.current = null;
      setIsListening(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);

  const handleSendMessage = useCallback(async () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping speech recognition:", err);
      }
    }

    if (!inputMessage.trim()) return;

    try {
      await sendMessage(inputMessage, currentMode);
      setInputMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }, [inputMessage, isListening, sendMessage, currentMode]);

  const toggleSpeechRecognition = useCallback(() => {
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
  }, [isSpeechSupported, loading, isListening]);

  const handleQuickQuestion = useCallback(async (question: string) => {
    try {
      await sendMessage(question, currentMode);
    } catch (err) {
      console.error("Error sending quick question:", err);
    }
  }, [sendMessage, currentMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleClearChat = useCallback(async () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
      return;
    }
    setShowClearConfirm(false);
    await clearChat();
  }, [showClearConfirm, clearChat]);

  // Skeleton for loading / no user
  if (!user || isInitializing) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-96 max-w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <div className="xl:col-span-3">
                <div className="bg-white rounded-2xl sm:rounded-3xl min-h-[500px] p-6 shadow-sm">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-sm">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
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

  const tipColor = TIP_COLORS[currentMode];
  const tips = [
    t(`aiHelper.tips.${currentMode}.1`),
    t(`aiHelper.tips.${currentMode}.2`),
    t(`aiHelper.tips.${currentMode}.3`),
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className={`rounded-lg p-3 w-fit ${currentModeConfig.bgColor}`}>
                  <currentModeConfig.icon className={`h-6 w-6 ${currentModeConfig.color}`} />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {t("aiHelper.header.title")} — {currentModeConfig.name}
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
                  {t("aiHelper.templates")}
                </Link>
              </div>

              {/* Mode switcher */}
              <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("aiHelper.header.title")}>
                {aiModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = currentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      role="tab"
                      aria-selected={isActive}
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
            {/* Chat Section — order-1 on all screens */}
            <div className="xl:col-span-3 order-1">
              <Card className="min-h-[400px] sm:min-h-[500px] h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] lg:h-[calc(100vh-400px)] flex flex-col">
                <CardHeader className="border-b flex-shrink-0 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${GRADIENT_COLORS[currentMode]}`}>
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
                      onClick={handleClearChat}
                      className={`w-fit ${
                        showClearConfirm
                          ? "text-white bg-red-600 hover:bg-red-700 border-red-600"
                          : "text-red-600 hover:text-red-700"
                      }`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {showClearConfirm ? t("aiHelper.clearConfirm") : t("aiHelper.clear")}
                      </span>
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
                      <div className="flex justify-center" role="alert">
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
                        title={t("aiHelper.empty.title")}
                        description={t("aiHelper.empty.desc")}
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
                              className={`group max-w-[90%] sm:max-w-[85%] lg:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 break-words ${
                                message.isUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                                {!message.isUser && (
                                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                                )}
                                <span className={`text-xs flex-shrink-0 ${
                                  message.isUser ? "text-blue-100" : "text-gray-500"
                                }`}>
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
                                {!message.isUser && (
                                  <CopyButton
                                    text={message.content}
                                    label={t("aiHelper.copied")}
                                  />
                                )}
                              </div>
                              <div className="prose prose-sm max-w-none text-sm sm:text-base">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children, ...props }: React.ComponentProps<'p'>) => (
                                      <p className="mb-1 sm:mb-2 last:mb-0" {...props}>
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
                                      <ul className="list-disc list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props}>
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
                                      <ol className="list-decimal list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1" {...props}>
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children, ...props }: React.ComponentProps<'li'>) => (
                                      <li className="text-xs sm:text-sm" {...props}>
                                        {children}
                                      </li>
                                    ),
                                    strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
                                      <strong className="font-semibold" {...props}>
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
                      </div>
                    )}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                          <LoadingSpinner size="sm" text={t("aiHelper.typing")} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-3 sm:p-4 flex-shrink-0 space-y-2">
                    {speechError && (
                      <p className="text-xs text-red-500 text-center" role="alert">
                        {speechError}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("aiHelper.input.placeholder")}
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
                          aria-label={isListening ? t("aiHelper.mic.stop") : t("aiHelper.mic.start")}
                          title={isListening ? t("aiHelper.mic.stop") : t("aiHelper.mic.start")}
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
                          aria-label={t("aiHelper.mic.unsupported")}
                          title={t("aiHelper.mic.unsupportedBrowser")}
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={handleSendMessage}
                        disabled={loading || !inputMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-shrink-0"
                        size="sm"
                        aria-label={t("aiHelper.input.send")}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Questions — order-2 on all screens */}
            <div className="space-y-4 sm:space-y-6 order-2">
              <Card className={`border-2 ${currentModeConfig.bgColor}`}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className={`flex items-center space-x-2 text-lg sm:text-xl ${currentModeConfig.color}`}>
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>{t("aiHelper.quickQuestions.title")}</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600">
                    {t(`aiHelper.quickQuestions.${currentMode}.desc`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {quickQuestions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickQuestion(item.question)}
                        className={`w-full text-left border rounded-lg p-4 sm:p-5 bg-white hover:shadow-sm transition-all duration-200 ${
                          loading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-[1.02] cursor-pointer"
                        } ${BORDER_COLORS[currentMode]}`}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${currentModeConfig.color}`} />
                          <span className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                            {item.question}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span>{t("aiHelper.tips.title")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${tipColor} mt-1.5 sm:mt-2 flex-shrink-0`} />
                      <p className="leading-relaxed">
                        {currentMode === "generator" && i === 2 ? (
                          <>
                            <Link href="/templates" className="text-purple-600 hover:underline font-medium">
                              {tip.split(" ")[0]}
                            </Link>
                            {" "}{tip.split(" ").slice(1).join(" ")}
                          </>
                        ) : (
                          tip
                        )}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
