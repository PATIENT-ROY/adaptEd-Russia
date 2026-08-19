"use client";

import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Sparkles,
  TrendingUp,
  Languages,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { BackButton } from "@/components/ui/back-button";

interface SlangTerm {
  term: string;
  pronunciation?: Record<string, string>;
  meaning: string;
  example: string;
  category: "университет" | "быт" | "сленг" | "оценки" | "процессы";
  popularity: "🔥 Очень популярный" | "⭐ Популярный" | "📚 Базовый";
}

const slangDictionary: SlangTerm[] = [
  {
    term: "Экзамен",
    pronunciation: {
      ru: "[эк-ЗА-мен]",
      en: "[ig-ZA-men]",
      fr: "[èg-za-mèn]",
      ar: "[إِغ-زا-مين]",
      zh: "[伊格-扎-门]",
    },
    meaning: "Форма контроля знаний с оценкой 2-5 баллов",
    example: "Завтра экзамен по математике",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Зачёт",
    pronunciation: {
      ru: "[за-ЧЁТ]",
      en: "[za-CHOT]",
      fr: "[za-chyot]",
      ar: "[زا-تشوت]",
      zh: "[扎-丘-特]",
    },
    meaning: "Форма контроля знаний с оценкой зачтено/не зачтено",
    example: "Получил зачёт по философии",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Сессия",
    pronunciation: {
      ru: "[СЕ-сия]",
      en: "[SE-sya]",
      fr: "[sé-sia]",
      ar: "[سي-سيا]",
      zh: "[塞-西亚]",
    },
    meaning: "Период сдачи экзаменов (обычно декабрь и май)",
    example: "В следующем месяце начинается сессия",
    category: "университет",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Стипуха",
    pronunciation: {
      ru: "[сти-ПУ-ха]",
      en: "[stee-POO-kha]",
      fr: "[sti-pou-kha]",
      ar: "[ستي-بو-خا]",
      zh: "[斯提-普-哈]",
    },
    meaning: "Стипендия",
    example: "Пришла стипуха, можем пойти в кафе",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Дедлайн",
    pronunciation: {
      ru: "[дед-ЛАЙН]",
      en: "[ded-LINE]",
      fr: "[dèd-line]",
      ar: "[ديد-لاين]",
      zh: "[德德-莱因]",
    },
    meaning: "Крайний срок сдачи работы",
    example: "У меня дедлайн по курсачу в пятницу",
    category: "процессы",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Курсач",
    pronunciation: {
      ru: "[кур-САЧ]",
      en: "[koor-SACH]",
      fr: "[cour-satch]",
      ar: "[كور-ساتش]",
      zh: "[库尔-萨奇]",
    },
    meaning: "Курсовая работа",
    example: "Нужно писать курсач",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Домашка",
    pronunciation: {
      ru: "[до-МАШ-ка]",
      en: "[da-MASH-ka]",
      fr: "[da-mach-ka]",
      ar: "[دا-ماش-كا]",
      zh: "[达-马什-卡]",
    },
    meaning: "Домашнее задание",
    example: "Много домашки по английскому",
    category: "процессы",
    popularity: "⭐ Популярный",
  },
  {
    term: "Коллоквиум",
    pronunciation: {
      ru: "[ка-ЛЛО-кви-ум]",
      en: "[ko-LOK-vee-um]",
      fr: "[ko-lok-vyum]",
      ar: "[كو-لوك-في-يوم]",
      zh: "[科洛-克维-乌姆]",
    },
    meaning: "Устное собеседование с преподавателем",
    example: "Завтра коллоквиум по истории",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Балик",
    pronunciation: {
      ru: "[БА-лик]",
      en: "[BA-lik]",
      fr: "[ba-lik]",
      ar: "[با-ليك]",
      zh: "[巴-力克]",
    },
    meaning: "Балл (оценка)",
    example: "Получил хороший балик на экзамене",
    category: "оценки",
    popularity: "⭐ Популярный",
  },
  {
    term: "Пара",
    pronunciation: {
      ru: "[ПА-ра]",
      en: "[PA-ra]",
      fr: "[pa-ra]",
      ar: "[با-را]",
      zh: "[帕-拉]",
    },
    meaning: "Учебное занятие продолжительностью 1.5 часа",
    example: "У меня 3 пары сегодня",
    category: "университет",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Лекция",
    pronunciation: {
      ru: "[ЛЕК-ци-я]",
      en: "[LEK-tsi-ya]",
      fr: "[lèk-tsi-ia]",
      ar: "[ليك-تسي-يا]",
      zh: "[列克-茨-娅]",
    },
    meaning: "Монолог преподавателя",
    example: "На лекции рассказывали про квантовую физику",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Семинар",
    pronunciation: {
      ru: "[се-ми-НАР]",
      en: "[se-mee-NAR]",
      fr: "[sé-mi-nar]",
      ar: "[سي-مي-نار]",
      zh: "[塞米-纳尔]",
    },
    meaning: "Интерактивное занятие с обсуждением",
    example: "На семинаре обсуждали новую тему",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Лабка",
    pronunciation: {
      ru: "[ЛАБ-ка]",
      en: "[LAB-ka]",
      fr: "[lab-ka]",
      ar: "[لاب-كا]",
      zh: "[拉布-卡]",
    },
    meaning: "Лабораторная работа",
    example: "Сегодня делаем лабку по химии",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Староста",
    pronunciation: {
      ru: "[ста-РО-ста]",
      en: "[sta-RO-sta]",
      fr: "[sta-ro-sta]",
      ar: "[ستا-رو-ستا]",
      zh: "[斯塔-罗-斯塔]",
    },
    meaning: "Студент-представитель группы",
    example: "Спроси у старосты о собрании",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Деканат",
    pronunciation: {
      ru: "[де-ка-НАТ]",
      en: "[de-ka-NAT]",
      fr: "[dé-ka-nat]",
      ar: "[دي-كا-نات]",
      zh: "[德卡-纳特]",
    },
    meaning: "Административный орган факультета",
    example: "Нужно сходить в деканат за справкой",
    category: "университет",
    popularity: "📚 Базовый",
  },
  {
    term: "Ботаник",
    pronunciation: {
      ru: "[ба-ТА-ник]",
      en: "[ba-TA-nik]",
      fr: "[bo-ta-nik]",
      ar: "[بو-تا-نيك]",
      zh: "[波-塔-尼克]",
    },
    meaning: "Студент, который много учится",
    example: "Ты настоящий ботаник!",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Хвост",
    pronunciation: {
      ru: "[ХВОСТ]",
      en: "[HVOST]",
      fr: "[hvost]",
      ar: "[خفوست]",
      zh: "[霍沃斯特]",
    },
    meaning: "Несданный зачёт или экзамен",
    example: "У меня два хвоста от прошлой сессии",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Свалить",
    pronunciation: {
      ru: "[сва-ЛИТЬ]",
      en: "[sva-LEET]",
      fr: "[sva-lit]",
      ar: "[سفا-ليت]",
      zh: "[斯瓦-利特]",
    },
    meaning: "Уйти с занятия раньше",
    example: "Давай свалим с последней пары",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Шпора",
    pronunciation: {
      ru: "[ШПО-ра]",
      en: "[SHPO-ra]",
      fr: "[chpo-ra]",
      ar: "[شبو-را]",
      zh: "[什波-拉]",
    },
    meaning: "Шпаргалка",
    example: "Написал шпоры для экзамена",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Госы",
    pronunciation: {
      ru: "[ГО-сы]",
      en: "[GO-sy]",
      fr: "[go-si]",
      ar: "[غو-سي]",
      zh: "[戈-斯]",
    },
    meaning: "Государственные экзамены",
    example: "Готовлюсь к госам",
    category: "процессы",
    popularity: "⭐ Популярный",
  },
  {
    term: "Дипломка",
    pronunciation: {
      ru: "[дип-ЛОМ-ка]",
      en: "[deep-LOM-ka]",
      fr: "[dip-lom-ka]",
      ar: "[ديب-لوم-كا]",
      zh: "[迪普-隆卡]",
    },
    meaning: "Дипломная работа",
    example: "Пишу дипломку",
    category: "университет",
    popularity: "⭐ Популярный",
  },
  {
    term: "Прокачка",
    pronunciation: {
      ru: "[про-КАЧ-ка]",
      en: "[pra-KACH-ka]",
      fr: "[pra-kach-ka]",
      ar: "[برا-كاش-كا]",
      zh: "[普罗-卡奇-卡]",
    },
    meaning: "Улучшение, развитие навыков",
    example: "Нужна прокачка английского",
    category: "сленг",
    popularity: "⭐ Популярный",
  },
  {
    term: "Автомат",
    pronunciation: {
      ru: "[ав-то-МАТ]",
      en: "[av-to-MAT]",
      fr: "[av-to-mat]",
      ar: "[أف-تو-مات]",
      zh: "[阿夫-托-马特]",
    },
    meaning: "Автоматический зачёт или экзамен без сдачи",
    example: "Получил автомат по физре",
    category: "сленг",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Пересдача",
    pronunciation: {
      ru: "[пе-рез-ДА-ча]",
      en: "[pe-rez-DA-cha]",
      fr: "[pé-rèz-da-tcha]",
      ar: "[بي-ريز-دا-تشا]",
      zh: "[佩雷-兹达-恰]",
    },
    meaning: "Повторная сдача экзамена",
    example: "Иду на пересдачу",
    category: "процессы",
    popularity: "📚 Базовый",
  },
  {
    term: "Стажировка",
    pronunciation: {
      ru: "[ста-жи-РОВ-ка]",
      en: "[sta-zhi-ROV-ka]",
      fr: "[sta-jhi-rov-ka]",
      ar: "[ستا-جهي-روف-كا]",
      zh: "[斯塔-日罗夫-卡]",
    },
    meaning: "Временная работа для получения опыта",
    example: "Прошёл стажировку в компании",
    category: "быт",
    popularity: "📚 Базовый",
  },
  {
    term: "Общага",
    pronunciation: {
      ru: "[об-ЩА-га]",
      en: "[ab-SHA-ga]",
      fr: "[ob-cha-ga]",
      ar: "[أب-شا-غا]",
      zh: "[奥布-恰-加]",
    },
    meaning: "Общежитие",
    example: "Живу в общаге",
    category: "быт",
    popularity: "🔥 Очень популярный",
  },
  {
    term: "Стипендия",
    pronunciation: {
      ru: "[сти-ПЕН-ди-я]",
      en: "[stee-PEN-dee-ya]",
      fr: "[sti-pèn-di-ia]",
      ar: "[ستي-بين-دي-يا]",
      zh: "[斯提-彭-迪娅]",
    },
    meaning: "Денежная выплата студентам",
    example: "Получил стипендию",
    category: "быт",
    popularity: "📚 Базовый",
  },
];

export default function StudentSlangPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("все");
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();

  const filteredTerms = useMemo(() => {
    return slangDictionary.filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.example.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "все" || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories = [
    { value: "все", labelKey: "studentSlang.categories.all" },
    {
      value: "университет",
      labelKey: "studentSlang.categories.university",
    },
    { value: "быт", labelKey: "studentSlang.categories.life" },
    { value: "сленг", labelKey: "studentSlang.categories.slang" },
    { value: "оценки", labelKey: "studentSlang.categories.grades" },
    { value: "процессы", labelKey: "studentSlang.categories.processes" },
  ];

  const phoneticLanguageMap: Record<Language, string> = {
    [Language.RU]: "ru",
    [Language.EN]: "en",
    [Language.FR]: "fr",
    [Language.AR]: "ar",
    [Language.ZH]: "zh",
  };

  const activePhoneticCode = phoneticLanguageMap[currentLanguage] ?? "en";

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton
            label={t("studentSlang.back")}
            className="mb-6"
            onClick={() => router.push("/education-guide")}
          />

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t("studentSlang.title")}
            </h1>
            <p className="text-xl text-gray-600">
              {t("studentSlang.subtitle")}
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t("studentSlang.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t(category.labelKey)}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-gray-500">
                  {t("studentSlang.pronunciationInfo")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {slangDictionary.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.terms")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        slangDictionary.filter((t) =>
                          t.popularity.includes("Очень популярный")
                        ).length
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.popular")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredTerms.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("studentSlang.stats.found")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dictionary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <Card
                key={term.term}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{term.term}</CardTitle>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {term.popularity}
                    </span>
                  </div>
                  {term.pronunciation?.[activePhoneticCode] && (
                    <p className="text-sm text-gray-500 italic">
                      [{term.pronunciation[activePhoneticCode]}]
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {t("studentSlang.meaning")}
                    </p>
                    <p className="text-sm text-gray-600">{term.meaning}</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3 bg-blue-50 rounded">
                    <p className="text-sm italic text-gray-700">
                      &ldquo;{term.example}&rdquo;
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Languages className="h-3 w-3 mr-1" />
                      {term.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredTerms.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("studentSlang.empty.title")}
                </h3>
                <p className="text-gray-600">
                  {t("studentSlang.empty.description")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
