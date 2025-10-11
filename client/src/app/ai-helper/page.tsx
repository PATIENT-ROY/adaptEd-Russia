"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const quickQuestions = [
  {
    question: "Что делать при потере паспорта?",
    category: "life",
    icon: AlertCircle,
  },
  {
    question: "Как зарегистрироваться в общежитии?",
    category: "life",
    icon: Home,
  },
  {
    question: "Когда начинается сессия?",
    category: "education",
    icon: Clock,
  },
  {
    question: "Как писать курсовую работу?",
    category: "education",
    icon: BookOpen,
  },
];

export default function AiHelperPage() {
  const { user } = useAuth();
  const { messages, loading, error, sendMessage, clearChat } = useChat(
    user?.id || ""
  );
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Автоматическая прокрутка к новым сообщениям
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      await sendMessage(inputMessage);
      setInputMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
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
        <div>Loading...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="rounded-lg bg-orange-50 p-3 w-fit">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  AI Помощник
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Задавайте вопросы на любом языке и получайте быстрые ответы
                </p>
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
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">
                          AI Консультант
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Задавайте вопросы о жизни и учёбе в России
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
                                  {new Date(
                                    message.timestamp
                                  ).toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="prose prose-sm max-w-none text-sm sm:text-base">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-1 sm:mb-2 last:mb-0">
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal list-inside mb-1 sm:mb-2 space-y-0.5 sm:space-y-1">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="text-xs sm:text-sm">
                                        {children}
                                      </li>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold">
                                        {children}
                                      </strong>
                                    ),
                                  }}
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
                    <div className="flex space-x-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Задайте вопрос..."
                        className="flex-1 text-sm sm:text-base"
                        disabled={loading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={loading || !inputMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-shrink-0"
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Questions */}
            <div className="space-y-4 sm:space-y-6 order-1 xl:order-2">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    <span>Быстрые вопросы</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600">
                    Популярные вопросы для быстрого старта
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {quickQuestions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={index}
                        className={`w-full border border-gray-300 rounded-lg p-4 sm:p-5 bg-white hover:bg-gray-50 hover:shadow-sm transition-all duration-200 cursor-pointer ${
                          loading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-[1.02]"
                        }`}
                        onClick={() =>
                          !loading && handleQuickQuestion(item.question)
                        }
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                          <span className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                            {item.question}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Советы</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="leading-relaxed">
                      Задавайте вопросы на любом языке
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="leading-relaxed">
                      AI поможет с документами и процедурами
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="leading-relaxed">
                      Получайте актуальную информацию
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
