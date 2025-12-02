"use client";

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
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import {
  StructuredData,
  websiteStructuredData,
  organizationStructuredData,
} from "@/components/seo/structured-data";
import { useTranslation } from "@/hooks/useTranslation";

// Компоненты features и benefits будут создаваться внутри компонента с использованием переводов

export default function HomePage() {
  const { t } = useTranslation();

  // Features с использованием переводов
  const features = [
    {
      icon: BookOpen,
      title: t("home.features.navigator"),
      description: t("home.features.navigator.desc"),
      color: "text-blue-600 bg-blue-50",
      gradient: "from-blue-500 to-blue-600",
      stats: t("home.section.features.stats"),
    },
    {
      icon: Bell,
      title: t("home.features.reminders"),
      description: t("home.features.reminders.desc"),
      color: "text-purple-600 bg-purple-50",
      gradient: "from-purple-500 to-purple-600",
      stats: t("home.section.features.stats.notifications"),
    },
    {
      icon: MessageSquare,
      title: t("home.features.ai"),
      description: t("home.features.ai.desc"),
      color: "text-orange-600 bg-orange-50",
      gradient: "from-orange-500 to-orange-600",
      stats: t("home.section.features.stats.ai"),
    },
    {
      icon: ScanLine,
      title: t("home.features.docscan"),
      description: t("home.features.docscan.desc"),
      color: "text-indigo-600 bg-indigo-50",
      gradient: "from-indigo-500 to-indigo-600",
      stats: "OCR + Перевод",
    },
  ];

  // Benefits с использованием переводов
  const benefits = [
    {
      icon: Globe,
      title: t("home.benefits.clear"),
      description: t("home.benefits.clear.desc"),
    },
    {
      icon: Shield,
      title: t("home.benefits.updated"),
      description: t("home.benefits.updated.desc"),
    },
    {
      icon: Bell,
      title: t("home.benefits.personal"),
      description: t("home.benefits.personal.desc"),
    },
    {
      icon: MessageSquare,
      title: t("home.benefits.support"),
      description: t("home.benefits.support.desc"),
    },
    {
      icon: Users,
      title: t("home.benefits.messengers"),
      description: t("home.benefits.messengers.desc"),
    },
    {
      icon: Award,
      title: t("home.benefits.verified"),
      description: t("home.benefits.verified.desc"),
    },
  ];

  // Pricing plans с использованием переводов
  const pricingPlans = [
    {
      name: t("home.pricing.freemium"),
      price: t("home.pricing.freemium.price"),
      description: t("home.pricing.freemium.description"),
      features: [
        t("home.pricing.feature.free.guides"),
        t("home.pricing.feature.free.reminders"),
        t("home.pricing.feature.free.templates"),
        t("home.pricing.feature.free.email"),
        t("home.pricing.feature.free.docscan"),
        t("home.pricing.feature.free.docscan.photo"),
      ],
      popular: false,
      buttonText: t("home.pricing.button.freemium"),
      buttonVariant: "outline" as const,
    },
    {
      name: t("home.pricing.premium"),
      price: t("home.pricing.premium.price"),
      description: t("home.pricing.premium.description"),
      features: [
        t("home.pricing.feature.premium.all"),
        t("home.pricing.feature.premium.unlimited"),
        t("home.pricing.feature.premium.ai"),
        t("home.pricing.feature.premium.templates"),
        t("home.pricing.feature.premium.support"),
        t("home.pricing.feature.premium.plan"),
        t("home.pricing.feature.premium.exclusive"),
        t("home.pricing.feature.premium.docscan.unlimited"),
        t("home.pricing.feature.premium.docscan.ocr"),
        t("home.pricing.feature.premium.docscan.export"),
        t("home.pricing.feature.premium.docscan.merge"),
        t("home.pricing.feature.premium.docscan.cloud"),
        t("home.pricing.feature.premium.docscan.noWatermark"),
      ],
      popular: true,
      buttonText: t("home.pricing.button.premium"),
      buttonVariant: "default" as const,
    },
  ];

  // Stats с использованием переводов
  const stats = [
    {
      icon: Users,
      value: t("home.stats.students.value"),
      label: t("home.stats.students"),
    },
    {
      icon: TrendingUp,
      value: t("home.stats.success.value"),
      label: t("home.stats.success"),
    },
    {
      icon: Shield,
      value: t("home.stats.support.value"),
      label: t("home.stats.support"),
    },
    {
      icon: Award,
      value: t("home.stats.universities.value"),
      label: t("home.stats.universities"),
    },
  ];

  // Testimonials с использованием переводов
  const testimonials = [
    {
      name: t("home.testimonial.1.name"),
      country: t("home.testimonial.1.country"),
      text: t("home.testimonial.1.text"),
      rating: 5,
    },
    {
      name: t("home.testimonial.2.name"),
      country: t("home.testimonial.2.country"),
      text: t("home.testimonial.2.text"),
      rating: 5,
    },
    {
      name: t("home.testimonial.3.name"),
      country: t("home.testimonial.3.country"),
      text: t("home.testimonial.3.text"),
      rating: 5,
    },
  ];
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
                {t("home.title")}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                {t("home.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 max-w-2xl mx-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 bg-white/15 backdrop-blur-sm border-white/40 text-white sm:hover:bg-white/20 sm:hover:border-white/50 active:bg-white/30 active:scale-95 shadow-lg sm:hover:shadow-xl active:shadow-md transform sm:hover:scale-105 transition-all duration-300">
                    <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t("home.start")}
                  </Button>
                </Link>
                <Link href="/education-guide" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-white/40 text-white bg-white/10 sm:hover:bg-white/20 active:bg-white/30 active:scale-95 backdrop-blur-sm shadow-lg sm:hover:shadow-xl active:shadow-md transform sm:hover:scale-105 transition-all duration-300"
                  >
                    <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t("home.guides")}
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-8 max-w-4xl mx-auto px-4 mb-8 sm:mb-12">
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

              {/* Main Features - Compact Version */}
              <div className="mt-8 sm:mt-12 max-w-5xl mx-auto px-2 sm:px-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={feature.title}
                        href={
                          feature.title === t("home.features.navigator")
                            ? "/education-guide"
                            : feature.title === t("home.features.reminders")
                            ? "/reminders"
                            : feature.title === t("home.features.ai")
                            ? "/ai-helper"
                            : feature.title === t("home.features.docscan")
                            ? "/docscan"
                            : "#"
                        }
                        className="group"
                      >
                        <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-white/25 hover:border-white/50 transition-all duration-300 h-full flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                          >
                            <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          </div>
                          <h3 className="text-xs sm:text-sm lg:text-base font-bold text-white mb-1 sm:mb-2 flex-shrink-0 leading-tight">
                            {feature.title}
                          </h3>
                          {feature.stats && (
                            <div className="text-[10px] sm:text-xs text-white/70 font-medium mt-auto flex-shrink-0">
                              {feature.stats}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
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

        {/* Features Section - Detailed */}
        <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-700 mb-4">
                <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Главные возможности платформы
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                {t("home.section.features.title")}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                {t("home.section.features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-4 lg:gap-6">
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
                    <CardContent className="p-2.5 sm:p-6 lg:p-8 relative z-10 flex flex-col min-h-[200px] sm:min-h-0">
                      <div
                        className={`w-9 h-9 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-1.5 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                      >
                        <Icon className="h-4 w-4 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h3 className="text-xs sm:text-lg lg:text-xl font-bold text-slate-900 mb-1 sm:mb-3 flex-shrink-0 leading-tight line-clamp-2">
                        {feature.title}
                      </h3>
                      <p className="text-[11px] sm:text-sm lg:text-base text-slate-600 mb-1 sm:mb-4 leading-snug sm:leading-relaxed flex-grow overflow-hidden line-clamp-5 sm:line-clamp-none">
                        {feature.description}
                      </p>
                      {feature.stats && (
                        <div className="text-[10px] sm:text-sm text-slate-500 font-medium mt-auto flex-shrink-0">
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
                {t("home.section.benefits.badge")}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                {t("home.section.benefits.title")}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto px-4">
                {t("home.section.benefits.subtitle")}
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
                {t("home.section.testimonials.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                {t("home.section.testimonials.subtitle")}
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
                {t("home.section.pricing.title")}
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-2">
                {t("home.section.pricing.subtitle")}
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
                        {t("home.pricing.popular")}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pt-6 sm:pt-8">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      {plan.popular ? (
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
                    <Link href={plan.popular ? "/payment/test" : "/register"}>
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
              {t("home.cta.title")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto px-2">
              {t("home.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="group text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    {t("home.cta.register")}
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
                    {t("home.cta.login")}
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
