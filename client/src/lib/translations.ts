import { Language } from "@/types";

export type TranslationKey = string;

// Функция для получения перевода
function getTranslations(language: Language) {
  return translations[language] || translations[Language.RU];
}

export const t = (key: TranslationKey, language: Language): string => {
  const translations = getTranslations(language);
  return translations[key] || key;
};

// Переводы для всех языков
const translations: Record<Language, Record<string, string>> = {
  [Language.RU]: {
    // Навигация
    "nav.home": "Главная",
    "nav.education": "Учёба",
    "nav.life": "Быт",
    "nav.support": "Поддержка",
    "nav.reminders": "Напоминания",
    "nav.aiHelper": "AI Помощник",
    "nav.admin": "Админ",
    "nav.login": "Войти",
    "nav.profile": "Профиль",
    
    // Футер
    "footer.platform": "Платформа",
    "footer.support": "Поддержка",
    "footer.copyright": "Все права защищены",
    "footer.madeWith": "Сделано с",
    "footer.inRussia": "в России",
    "footer.privacy": "Политика конфиденциальности",
    
    // Домашняя страница
    "home.title": "Адаптация к жизни в России",
    "home.subtitle": "Полная поддержка иностранных студентов: от поступления до успешной адаптации к жизни и учёбе в российских вузах",
    "home.start": "Начать адаптацию",
    "home.guides": "Образовательные гайды",
    
    "home.stats.students": "Студентов",
    "home.stats.success": "Успешность",
    "home.stats.support": "Поддержка",
    "home.stats.universities": "Вузов",
    
    "home.features.navigator": "Образовательный навигатор",
    "home.features.navigator.desc": "Понятные гайды по системе образования в России: зачёты, ГОСТ, кафедры, сессии",
    "home.features.guide": "Бытовой гид",
    "home.features.guide.desc": "Пошаговые инструкции: регистрация, медстраховка, транспорт, документы",
    "home.features.reminders": "Умные напоминания",
    "home.features.reminders.desc": "Автоматические уведомления о важных датах и сроках",
    "home.features.ai": "AI-консультант",
    "home.features.ai.desc": "Задавайте вопросы на родном языке и получайте быстрые ответы",
    
    "home.benefits.clear": "Понятные инструкции",
    "home.benefits.clear.desc": "Все материалы на вашем родном языке с подробными объяснениями",
    "home.benefits.updated": "Актуальная информация",
    "home.benefits.updated.desc": "Регулярно обновляемые данные о правилах и процедурах",
    "home.benefits.personal": "Персональные напоминания",
    "home.benefits.personal.desc": "Умные уведомления о важных датах и сроках",
    "home.benefits.support": "Поддержка 24/7",
    "home.benefits.support.desc": "AI-помощник всегда готов ответить на ваши вопросы",
    
    "home.pricing.freemium": "Freemium",
    "home.pricing.freemium.price": "Бесплатно",
    "home.pricing.premium": "Премиум",
    "home.pricing.premium.price": "299₽/мес",
    
    "home.cta.title": "Готовы начать?",
    "home.cta.subtitle": "Присоединяйтесь к тысячам иностранных студентов, которые уже используют нашу платформу для успешной адаптации в России",
    "home.cta.register": "Зарегистрироваться",
    "home.cta.login": "Войти в аккаунт",
  },
  
  [Language.EN]: {
    // Navigation
    "nav.home": "Home",
    "nav.education": "Education",
    "nav.life": "Daily Life",
    "nav.support": "Support",
    "nav.reminders": "Reminders",
    "nav.aiHelper": "AI Helper",
    "nav.admin": "Admin",
    "nav.login": "Login",
    "nav.profile": "Profile",
    
    // Footer
    "footer.platform": "Platform",
    "footer.support": "Support",
    "footer.copyright": "All rights reserved",
    "footer.madeWith": "Made with",
    "footer.inRussia": "in Russia",
    "footer.privacy": "Privacy Policy",
    
    // Home Page
    "home.title": "Adaptation to Life in Russia",
    "home.subtitle": "Complete support for international students: from admission to successful adaptation to life and studies in Russian universities",
    "home.start": "Start Adaptation",
    "home.guides": "Educational Guides",
    
    "home.stats.students": "Students",
    "home.stats.success": "Success Rate",
    "home.stats.support": "Support",
    "home.stats.universities": "Universities",
    
    "home.features.navigator": "Educational Navigator",
    "home.features.navigator.desc": "Clear guides on the Russian education system: exams, GOST, departments, sessions",
    "home.features.guide": "Daily Life Guide",
    "home.features.guide.desc": "Step-by-step instructions: registration, medical insurance, transport, documents",
    "home.features.reminders": "Smart Reminders",
    "home.features.reminders.desc": "Automatic notifications about important dates and deadlines",
    "home.features.ai": "AI Consultant",
    "home.features.ai.desc": "Ask questions in your native language and get quick answers",
    
    "home.benefits.clear": "Clear Instructions",
    "home.benefits.clear.desc": "All materials in your native language with detailed explanations",
    "home.benefits.updated": "Updated Information",
    "home.benefits.updated.desc": "Regularly updated data on rules and procedures",
    "home.benefits.personal": "Personal Reminders",
    "home.benefits.personal.desc": "Smart notifications about important dates and deadlines",
    "home.benefits.support": "24/7 Support",
    "home.benefits.support.desc": "AI assistant is always ready to answer your questions",
    
    "home.pricing.freemium": "Freemium",
    "home.pricing.freemium.price": "Free",
    "home.pricing.premium": "Premium",
    "home.pricing.premium.price": "299₽/mo",
    
    "home.cta.title": "Ready to Start?",
    "home.cta.subtitle": "Join thousands of international students who are already using our platform for successful adaptation in Russia",
    "home.cta.register": "Sign Up",
    "home.cta.login": "Sign In",
  },
  
  [Language.FR]: {
    // Navigation
    "nav.home": "Accueil",
    "nav.education": "Éducation",
    "nav.life": "Vie quotidienne",
    "nav.support": "Support",
    "nav.reminders": "Rappels",
    "nav.aiHelper": "Assistant IA",
    "nav.admin": "Admin",
    "nav.login": "Connexion",
    "nav.profile": "Profil",
    
    // Footer
    "footer.platform": "Plateforme",
    "footer.support": "Support",
    "footer.copyright": "Tous droits réservés",
    "footer.madeWith": "Fait avec",
    "footer.inRussia": "en Russie",
    "footer.privacy": "Politique de confidentialité",
    
    // Home Page
    "home.title": "Adaptation à la vie en Russie",
    "home.subtitle": "Soutien complet pour les étudiants internationaux: de l'admission à l'adaptation réussie à la vie et aux études dans les universités russes",
    "home.start": "Commencer l'adaptation",
    "home.guides": "Guides éducatifs",
    
    "home.stats.students": "Étudiants",
    "home.stats.success": "Taux de réussite",
    "home.stats.support": "Support",
    "home.stats.universities": "Universités",
    
    "home.features.navigator": "Navigateur éducatif",
    "home.features.navigator.desc": "Guides clairs sur le système éducatif russe: examens, GOST, départements, sessions",
    "home.features.guide": "Guide de la vie quotidienne",
    "home.features.guide.desc": "Instructions étape par étape: inscription, assurance maladie, transport, documents",
    "home.features.reminders": "Rappels intelligents",
    "home.features.reminders.desc": "Notifications automatiques sur les dates et échéances importantes",
    "home.features.ai": "Conseiller IA",
    "home.features.ai.desc": "Posez des questions dans votre langue maternelle et obtenez des réponses rapides",
    
    "home.benefits.clear": "Instructions claires",
    "home.benefits.clear.desc": "Tous les matériaux dans votre langue maternelle avec des explications détaillées",
    "home.benefits.updated": "Informations mises à jour",
    "home.benefits.updated.desc": "Données régulièrement mises à jour sur les règles et procédures",
    "home.benefits.personal": "Rappels personnels",
    "home.benefits.personal.desc": "Notifications intelligentes sur les dates et échéances importantes",
    "home.benefits.support": "Support 24/7",
    "home.benefits.support.desc": "L'assistant IA est toujours prêt à répondre à vos questions",
    
    "home.pricing.freemium": "Freemium",
    "home.pricing.freemium.price": "Gratuit",
    "home.pricing.premium": "Premium",
    "home.pricing.premium.price": "299₽/mois",
    
    "home.cta.title": "Prêt à commencer?",
    "home.cta.subtitle": "Rejoignez des milliers d'étudiants internationaux qui utilisent déjà notre plateforme pour une adaptation réussie en Russie",
    "home.cta.register": "S'inscrire",
    "home.cta.login": "Se connecter",
  },
  
  [Language.AR]: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.education": "التعليم",
    "nav.life": "الحياة اليومية",
    "nav.support": "الدعم",
    "nav.reminders": "التذكيرات",
    "nav.aiHelper": "مساعد الذكاء الاصطناعي",
    "nav.admin": "المسؤول",
    "nav.login": "تسجيل الدخول",
    "nav.profile": "الملف الشخصي",
    
    // Footer
    "footer.platform": "المنصة",
    "footer.support": "الدعم",
    "footer.copyright": "جميع الحقوق محفوظة",
    "footer.madeWith": "صنع بـ",
    "footer.inRussia": "في روسيا",
    "footer.privacy": "سياسة الخصوصية",
    
    // Home Page
    "home.title": "التكيف مع الحياة في روسيا",
    "home.subtitle": "دعم كامل للطلاب الدوليين: من القبول إلى التكيف الناجح مع الحياة والدراسة في الجامعات الروسية",
    "home.start": "بدء التكيف",
    "home.guides": "الأدلة التعليمية",
    
    "home.stats.students": "الطلاب",
    "home.stats.success": "معدل النجاح",
    "home.stats.support": "الدعم",
    "home.stats.universities": "الجامعات",
    
    "home.features.navigator": "الملاح التعليمي",
    "home.features.navigator.desc": "أدلة واضحة حول نظام التعليم الروسي: الاختبارات، GOST، الأقسام، الجلسات",
    "home.features.guide": "دليل الحياة اليومية",
    "home.features.guide.desc": "تعليمات خطوة بخطوة: التسجيل، التأمين الصحي، النقل، الوثائق",
    "home.features.reminders": "تذكيرات ذكية",
    "home.features.reminders.desc": "إشعارات تلقائية حول التواريخ المهمة والمواعيد النهائية",
    "home.features.ai": "مستشار الذكاء الاصطناعي",
    "home.features.ai.desc": "اطرح الأسئلة بلغتك الأم واحصل على إجابات سريعة",
    
    "home.benefits.clear": "تعليمات واضحة",
    "home.benefits.clear.desc": "جميع المواد بلغتك الأم مع شرح مفصل",
    "home.benefits.updated": "معلومات محدثة",
    "home.benefits.updated.desc": "بيانات محدثة بانتظام حول القواعد والإجراءات",
    "home.benefits.personal": "تذكيرات شخصية",
    "home.benefits.personal.desc": "إشعارات ذكية حول التواريخ المهمة والمواعيد النهائية",
    "home.benefits.support": "دعم 24/7",
    "home.benefits.support.desc": "المساعد بالذكاء الاصطناعي جاهز دائماً للإجابة على أسئلتك",
    
    "home.pricing.freemium": "فريميوم",
    "home.pricing.freemium.price": "مجاني",
    "home.pricing.premium": "بريميوم",
    "home.pricing.premium.price": "299₽/شهر",
    
    "home.cta.title": "هل أنت مستعد للبدء؟",
    "home.cta.subtitle": "انضم إلى آلاف الطلاب الدوليين الذين يستخدمون بالفعل منصتنا للتكيف الناجح في روسيا",
    "home.cta.register": "التسجيل",
    "home.cta.login": "تسجيل الدخول",
  },
  
  [Language.ZH]: {
    // Navigation
    "nav.home": "首页",
    "nav.education": "教育",
    "nav.life": "日常生活",
    "nav.support": "支持",
    "nav.reminders": "提醒",
    "nav.aiHelper": "AI助手",
    "nav.admin": "管理",
    "nav.login": "登录",
    "nav.profile": "个人资料",
    
    // Footer
    "footer.platform": "平台",
    "footer.support": "支持",
    "footer.copyright": "版权所有",
    "footer.madeWith": "制作",
    "footer.inRussia": "在俄罗斯",
    "footer.privacy": "隐私政策",
    
    // Home Page
    "home.title": "适应俄罗斯生活",
    "home.subtitle": "为国际学生提供全面支持：从录取到成功适应俄罗斯大学的生活和学习",
    "home.start": "开始适应",
    "home.guides": "教育指南",
    
    "home.stats.students": "学生",
    "home.stats.success": "成功率",
    "home.stats.support": "支持",
    "home.stats.universities": "大学",
    
    "home.features.navigator": "教育导航",
    "home.features.navigator.desc": "清晰的俄罗斯教育系统指南：考试、GOST、院系、学期",
    "home.features.guide": "生活指南",
    "home.features.guide.desc": "分步说明：注册、医疗保险、交通、文件",
    "home.features.reminders": "智能提醒",
    "home.features.reminders.desc": "重要日期和截止日期的自动通知",
    "home.features.ai": "AI顾问",
    "home.features.ai.desc": "用您的母语提问并获得快速回答",
    
    "home.benefits.clear": "清晰说明",
    "home.benefits.clear.desc": "所有材料都有您母语的详细解释",
    "home.benefits.updated": "最新信息",
    "home.benefits.updated.desc": "定期更新的规则和程序数据",
    "home.benefits.personal": "个人提醒",
    "home.benefits.personal.desc": "重要日期和截止日期的智能通知",
    "home.benefits.support": "24/7支持",
    "home.benefits.support.desc": "AI助手随时准备回答您的问题",
    
    "home.pricing.freemium": "免费版",
    "home.pricing.freemium.price": "免费",
    "home.pricing.premium": "高级版",
    "home.pricing.premium.price": "299₽/月",
    
    "home.cta.title": "准备开始了吗？",
    "home.cta.subtitle": "加入数千名已经在使用我们平台成功适应俄罗斯的国际学生",
    "home.cta.register": "注册",
    "home.cta.login": "登录",
  },
};

export { getTranslations };

