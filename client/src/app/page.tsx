import { Metadata } from "next";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Home,
  Bell,
  MessageSquare,
  Globe,
  Sparkles,
  Crown,
  CreditCard,
  Zap,
  Star,
  Users,
  TrendingUp,
  Shield,
  Award,
  Target,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import {
  StructuredData,
  websiteStructuredData,
  organizationStructuredData,
} from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Главная - Адаптация иностранных студентов в России",
  description:
    "Добро пожаловать в AdaptEd Russia! Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах. Образовательные гайды, бытовые советы, AI-помощник.",
  keywords: [
    "иностранные студенты",
    "адаптация в России",
    "образование в России",
    "российские вузы",
    "студенческая жизнь",
    "помощь студентам",
  ],
  openGraph: {
    title: "AdaptEd Russia - Главная",
    description:
      "Добро пожаловать в AdaptEd Russia! Платформа для помощи иностранным студентам в адаптации к жизни и учёбе в российских вузах.",
    url: "https://adapted-russia.com",
  },
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    icon: BookOpen,
    title: "Образовательный навигатор",
    description:
      "Понятные гайды по системе образования в России: зачёты, ГОСТ, кафедры, сессии",
    color: "text-blue-600 bg-blue-50",
    gradient: "from-blue-500 to-blue-600",
    stats: "500+ гайдов",
  },
  {
    icon: Home,
    title: "Бытовой гид",
    description:
      "Пошаговые инструкции: регистрация, медстраховка, транспорт, документы",
    color: "text-green-600 bg-green-50",
    gradient: "from-green-500 to-green-600",
    stats: "100+ инструкций",
  },
  {
    icon: Bell,
    title: "Умные напоминания",
    description: "Автоматические уведомления о важных датах и сроках",
    color: "text-purple-600 bg-purple-50",
    gradient: "from-purple-500 to-purple-600",
    stats: "24/7 уведомления",
  },
  {
    icon: MessageSquare,
    title: "AI-консультант",
    description: "Задавайте вопросы на родном языке и получайте быстрые ответы",
    color: "text-orange-600 bg-orange-50",
    gradient: "from-orange-500 to-orange-600",
    stats: "AI поддержка",
  },
];

const benefits = [
  {
    icon: Globe,
    title: "Понятные инструкции",
    description:
      "Все материалы на вашем родном языке с подробными объяснениями",
  },
  {
    icon: Shield,
    title: "Актуальная информация",
    description: "Регулярно обновляемые данные о правилах и процедурах",
  },
  {
    icon: Bell,
    title: "Персональные напоминания",
    description: "Умные уведомления о важных датах и сроках",
  },
  {
    icon: MessageSquare,
    title: "Поддержка 24/7",
    description: "AI-помощник всегда готов ответить на ваши вопросы",
  },
  {
    icon: Users,
    title: "Интеграция с мессенджерами",
    description:
      "Получайте уведомления в Telegram, WhatsApp и других приложениях",
  },
  {
    icon: Award,
    title: "Проверенные материалы",
    description: "Все гайды созданы экспертами и проверены тысячами студентов",
  },
];

const pricingPlans = [
  {
    name: "Freemium",
    price: "Бесплатно",
    description: "Базовый доступ для всех",
    features: [
      "Бесплатный доступ ко всем базовым гайдам",
      "2 уведомления-напоминания в месяц",
      "Базовые шаблоны документов",
      "Поддержка по email",
      "DocScan Light: сканирование до 3 документов в месяц",
      "DocScan Light: только фото → PDF",
    ],
    popular: false,
    buttonText: "Начать бесплатно",
    buttonVariant: "outline" as const,
  },
  {
    name: "Премиум",
    price: "299₽/мес",
    description: "Полный доступ ко всем функциям",
    features: [
      "Полный доступ ко всем функциям",
      "Неограниченные уведомления-напоминания в месяц",
      "Приоритетный доступ к AI-чату",
      "Расширенные шаблоны документов",
      "Приоритетная поддержка 24/7",
      "Персональный план адаптации",
      "Эксклюзивные гайды и материалы",
      "DocScan Pro: Неограниченное сканирование",
      "DocScan Pro: OCR из PDF и фото",
      "DocScan Pro: Экспорт в Word, TXT, PDF",
      "DocScan Pro: Объединение страниц",
      "DocScan Pro: Облачное хранение",
      "DocScan Pro: Без водяных знаков",
    ],
    popular: true,
    buttonText: "Выбрать Премиум",
    buttonVariant: "default" as const,
  },
];

const stats = [
  { icon: Users, value: "10,000+", label: "Студентов" },
  { icon: TrendingUp, value: "95%", label: "Успешность" },
  { icon: Shield, value: "24/7", label: "Поддержка" },
  { icon: Award, value: "50+", label: "Вузов" },
];

const testimonials = [
  {
    name: "Ахмед Аль-Махмуд",
    country: "Египет",
    text: "Благодаря AdaptEd Russia я легко адаптировался к жизни в России. Все гайды очень понятные!",
    rating: 5,
  },
  {
    name: "джесс дайда",
    country: "Д.Р.Конго",
    text: "AI-помощник отвечает на все мои вопросы на французском языке. Очень удобно!",
    rating: 5,
  },
  {
    name: "Чжан Вэй",
    country: "Китай",
    text: "Умные напоминания спасли меня от пропуска важных дедлайнов. Рекомендую всем!",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <>
      <StructuredData data={websiteStructuredData} />
      <StructuredData data={organizationStructuredData} />
      <Layout>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-8 sm:py-12 md:py-24">
          <div className="absolute inset-0 bg-black/10"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white mb-4 sm:mb-6 px-4">
                Адаптация к жизни в{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  России
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                Полная поддержка иностранных студентов: от поступления до
                успешной адаптации к жизни и учёбе в российских вузах
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 max-w-2xl mx-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 bg-white/15 backdrop-blur-sm border-white/40 text-white sm:hover:bg-white/20 sm:hover:border-white/50 active:bg-white/30 active:scale-95 shadow-lg sm:hover:shadow-xl active:shadow-md transform sm:hover:scale-105 transition-all duration-300">
                    <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Начать адаптацию
                  </Button>
                </Link>
                <Link href="/education-guide" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-white/40 text-white bg-white/10 sm:hover:bg-white/20 active:bg-white/30 active:scale-95 backdrop-blur-sm shadow-lg sm:hover:shadow-xl active:shadow-md transform sm:hover:scale-105 transition-all duration-300"
                  >
                    <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Образовательные гайды
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8 max-w-4xl mx-auto px-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="text-center p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-white/80 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-2 sm:h-3 bg-white/60 rounded-full mt-1 sm:mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                Всё, что нужно для успешной адаптации
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Наша платформа предоставляет полный набор инструментов для
                комфортной жизни и учёбы в России
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="group hover:scale-105 transition-all duration-300 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl overflow-hidden"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardContent className="p-4 sm:p-6 lg:p-8 relative z-10">
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      {feature.stats && (
                        <div className="text-xs sm:text-sm text-slate-500 font-medium">
                          {feature.stats}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          className="py-12 sm:py-16 md:py-24 relative overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white mb-6 sm:mb-8 shadow-lg border border-white/20">
                <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Проверено тысячами студентов
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                Почему выбирают AdaptEd Russia?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto px-4">
                Мы помогаем иностранным студентам быстро адаптироваться к жизни
                в России
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="group p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-white">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
                Что говорят наши студенты
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                Реальные отзывы от иностранных студентов, которые уже используют
                нашу платформу
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.name}
                  className="group hover:scale-105 transition-all duration-500 animate-fade-in-up border-0 shadow-xl hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center mb-3 sm:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 italic">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg mr-3 sm:mr-4">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm sm:text-base">
                          {testimonial.name}
                        </div>
                        <div className="text-slate-600 text-xs sm:text-sm">
                          {testimonial.country}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
                💸 Подписки
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                Выберите план, который подходит именно вам
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={plan.name}
                  className={`group hover:scale-105 transition-all duration-500 relative flex flex-col ${
                    plan.popular
                      ? "ring-4 ring-blue-500 shadow-2xl"
                      : "shadow-xl hover:shadow-2xl"
                  }`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    background:
                      "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                        <Star className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Популярный
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pt-6 sm:pt-8">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      {plan.name === "Премиум" ? (
                        <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600 mr-2 sm:mr-3" />
                      ) : (
                        <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mr-2 sm:mr-3" />
                      )}
                      <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                      {plan.price}
                    </div>
                    <CardDescription className="text-sm sm:text-base lg:text-lg">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full">
                    <div>
                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start space-x-3 sm:space-x-4"
                          >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-slate-700 text-sm sm:text-base lg:text-lg">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={
                        plan.name === "Freemium" ? "/register" : "/payment/test"
                      }
                    >
                      <Button
                        className={`w-full text-sm sm:text-base lg:text-lg py-3 sm:py-4 ${
                          plan.popular
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl"
                            : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300"
                        }`}
                        variant={plan.buttonVariant}
                        size="lg"
                      >
                        {plan.popular && (
                          <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                        {plan.buttonText}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute top-0 left-0 w-full h-full opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center px-3 sm:px-4 lg:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-6 sm:mb-8">
              Готовы начать?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
              Присоединяйтесь к тысячам иностранных студентов, которые уже
              используют нашу платформу для успешной адаптации в России
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    Зарегистрироваться
                  </span>
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="group text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <Target className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    Войти в аккаунт
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}
