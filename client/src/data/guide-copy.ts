import { GuideCategory, Language, type Guide } from "@/types";

export type GuideCopy = { title: string; excerpt: string };

const L = Language;

function pack(
  ru: GuideCopy,
  en: GuideCopy,
  fr: GuideCopy,
  ar: GuideCopy,
  zh: GuideCopy,
): Record<Language, GuideCopy> {
  return {
    [L.RU]: ru,
    [L.EN]: en,
    [L.FR]: fr,
    [L.AR]: ar,
    [L.ZH]: zh,
  };
}

export const LIFE_GUIDE_COPY: Record<string, Record<Language, GuideCopy>> = {
  "1": pack(
    { title: "Как зарегистрироваться в общежитии", excerpt: "Как заселиться в студенческое общежитие: документы, договор и что проверить в комнате." },
    { title: "How to check into a student dorm", excerpt: "How to move into a university dorm: papers, the housing contract, and what to check in the room." },
    { title: "Comment emménager en résidence universitaire", excerpt: "Documents, contrat de logement et ce qu’il faut vérifier dans la chambre." },
    { title: "كيف تسجّل في السكن الجامعي", excerpt: "الأوراق وعقد السكن وما يجب فحصه في الغرفة عند الوصول." },
    { title: "如何入住学生宿舍", excerpt: "入住大学宿舍所需文件、住宿合同，以及进房后要检查什么。" },
  ),
  "2": pack(
    { title: "Получение ИНН и СНИЛС", excerpt: "Зачем студенту ИНН и СНИЛС и как оформить их после приезда." },
    { title: "Getting an INN and SNILS", excerpt: "Why international students need a tax ID and SNILS, and how to apply after arrival." },
    { title: "Obtenir un INN et un SNILS", excerpt: "Pourquoi un étudiant a besoin d’un numéro fiscal et d’un SNILS, et comment les demander." },
    { title: "الحصول على ИНН وСНИЛС", excerpt: "لماذا يحتاج الطالب رقمًا ضريبيًا وСНИЛС وكيف تستخرجها بعد الوصول." },
    { title: "办理税号 ИНН 和 СНИЛС", excerpt: "国际学生为什么需要税号和社保号，以及到俄后如何办理。" },
  ),
  "3": pack(
    { title: "Что делать при потере паспорта", excerpt: "Если паспорт потерян или украден: полиция, университет и консульство — по шагам." },
    { title: "What to do if you lose your passport", excerpt: "If your passport is lost or stolen: police, university, and consulate, step by step." },
    { title: "Que faire en cas de perte de passeport", excerpt: "Passeport perdu ou volé : police, université et consulat, étape par étape." },
    { title: "ماذا تفعل إذا فقدت جواز سفرك", excerpt: "إذا ضاع جواز السفر أو سُرق: الشرطة والجامعة والقنصلية خطوة بخطوة." },
    { title: "护照丢失怎么办", excerpt: "护照丢失或被盗后：报警、联系大学和领馆的步骤。" },
  ),
  "4": pack(
    { title: "Как вызвать врача в России", excerpt: "Когда звонить 103 или 112, как вызвать врача на дом и что сказать диспетчеру." },
    { title: "How to call a doctor in Russia", excerpt: "When to dial 103 or 112, how to request a home visit, and what to tell the dispatcher." },
    { title: "Comment appeler un médecin en Russie", excerpt: "Quand composer le 103 ou le 112, comment demander une visite à domicile." },
    { title: "كيف تستدعي طبيبًا في روسيا", excerpt: "متى تتصل بـ 103 أو 112 وكيف تطلب زيارة منزلية." },
    { title: "在俄罗斯如何叫医生", excerpt: "何时拨打 103 或 112、如何预约出诊，以及如何向调度说明情况。" },
  ),
  "5": pack(
    { title: "Транспорт в России: метро, автобусы, такси", excerpt: "Как пользоваться метро, автобусами и такси: карты оплаты, приложения и базовые правила." },
    { title: "Transport in Russia: metro, buses, taxis", excerpt: "How to use the metro, buses, and taxis: payment cards, apps, and basic rules." },
    { title: "Transports en Russie : métro, bus, taxis", excerpt: "Métro, bus et taxis : cartes de paiement, applications et règles de base." },
    { title: "المواصلات في روسيا: المترو والحافلات والتاكسي", excerpt: "كيف تستخدم المترو والحافلات والتاكسي: بطاقات الدفع والتطبيقات والقواعد الأساسية." },
    { title: "俄罗斯交通：地铁、公交与出租车", excerpt: "如何乘坐地铁、公交和出租车：乘车卡、应用和基本规则。" },
  ),
  "7": pack(
    { title: "Миграционный учёт и регистрация", excerpt: "Что такое миграционный учёт, кто его делает и какие сроки нельзя пропустить." },
    { title: "Migration registration", excerpt: "What migration registration is, who files it, and the deadlines you must not miss." },
    { title: "Enregistrement migratoire", excerpt: "Ce qu’est l’enregistrement migratoire, qui le fait et les délais à respecter." },
    { title: "التسجيل الهجري", excerpt: "ما هو التسجيل الهجري ومن يقوم به وما المهل التي لا يجوز تفويتها." },
    { title: "移民登记", excerpt: "什么是移民登记、由谁办理，以及不能错过的期限。" },
  ),
  "8": pack(
    { title: "Банковские услуги для студента", excerpt: "Как открыть дебетовую карту в России: какие документы взять и что уточнить в банке." },
    { title: "Banking for students", excerpt: "How to open a debit card in Russia: documents to bring and what to ask the bank." },
    { title: "Services bancaires pour étudiants", excerpt: "Ouvrir une carte de débit : documents à apporter et questions à poser à la banque." },
    { title: "الخدمات المصرفية للطالب", excerpt: "كيف تفتح بطاقة خصم في روسيا: المستندات وما تسأله في البنك." },
    { title: "学生银行服务", excerpt: "如何在俄罗斯办借记卡：携带哪些材料、到银行要确认什么。" },
  ),
  "14": pack(
    { title: "Медицинские анализы", excerpt: "Где сдать анализы: поликлиника по полису, платные клиники и что обычно требуют вузы." },
    { title: "Medical tests", excerpt: "Where to get lab tests: public clinic with insurance, paid clinics, and what universities often require." },
    { title: "Analyses médicales", excerpt: "Où faire des analyses : clinique publique, laboratoires payants et exigences des universités." },
    { title: "التحاليل الطبية", excerpt: "أين تجري التحاليل: العيادة بالتأمين والعيادات المدفوعة وما يطلبه الجامعة غالبًا." },
    { title: "体检化验", excerpt: "去哪里做化验：医保诊所、收费机构，以及大学常见要求。" },
  ),
  "migration-card": pack(
    { title: "Миграционная карта", excerpt: "Как заполнить и хранить миграционную карту — её спрашивают при регистрации и проверках." },
    { title: "Migration card", excerpt: "How to fill in and keep your migration card — you will need it for registration and checks." },
    { title: "Carte de migration", excerpt: "Comment remplir et conserver la carte de migration, demandée à l’enregistrement." },
    { title: "بطاقة الهجرة", excerpt: "كيف تملأ بطاقة الهجرة وتحتفظ بها — ستُطلب عند التسجيل والتفتيش." },
    { title: "移民卡", excerpt: "如何填写并保管移民卡——登记和检查时都会用到。" },
  ),
  "contact-university": pack(
    { title: "Связаться с университетом после приезда", excerpt: "Кому написать в первые сутки: международный отдел, куратор и что сообщить о прибытии." },
    { title: "Contact your university after arrival", excerpt: "Who to message on day one: international office, curator, and what to say about arrival." },
    { title: "Contacter l’université après l’arrivée", excerpt: "Qui écrire dès le premier jour : service international, tuteur, et quoi dire." },
    { title: "التواصل مع الجامعة بعد الوصول", excerpt: "من تراسل في اليوم الأول: القسم الدولي والمشرف وما تخبرهم عن وصولك." },
    { title: "抵达后联系大学", excerpt: "到校第一天该联系谁：国际处、辅导员，以及如何说明抵达情况。" },
  ),
  "rvpo": pack(
    { title: "РВПО — разрешение на временное проживание по обучению", excerpt: "Что даёт РВПО студенту, чем отличается от РВП и куда подавать документы." },
    { title: "RVPO — study-based temporary residence", excerpt: "What RVPO gives a student, how it differs from RVP, and where to apply." },
    { title: "RVPO — résidence temporaire pour études", excerpt: "Ce que le RVPO apporte, la différence avec le RVP et où déposer le dossier." },
    { title: "РВПО — إقامة مؤقتة للدراسة", excerpt: "ماذا يمنح РВПО للطالب وبماذا يختلف عن РВП وأين تقدّم الأوراق." },
    { title: "РВПО：因学习的临时居留许可", excerpt: "РВПО对学生意味着什么、与РВП的区别，以及去哪里申请。" },
  ),
  "rvp": pack(
    { title: "РВП — разрешение на временное проживание", excerpt: "Кому нужен РВП, какие документы собирают и чем это отличается от учебной визы." },
    { title: "RVP — temporary residence permit", excerpt: "Who needs an RVP, which documents to collect, and how it differs from a student visa." },
    { title: "RVP — permis de séjour temporaire", excerpt: "Qui a besoin d’un RVP, quels documents réunir et la différence avec le visa étudiant." },
    { title: "РВП — تصريح الإقامة المؤقتة", excerpt: "من يحتاج РВП وما الأوراق وبماذا يختلف عن تأشيرة الدراسة." },
    { title: "РВП 临时居留许可", excerpt: "谁需要РВП、准备哪些材料，以及它和学生签证的区别。" },
  ),
  "vnzh": pack(
    { title: "ВНЖ — вид на жительство", excerpt: "Когда студенту имеет смысл оформлять ВНЖ и какие шаги обычно идут после РВП." },
    { title: "VNZh — residence permit", excerpt: "When a residence permit makes sense for a student and the usual steps after RVP." },
    { title: "VNZh — titre de séjour", excerpt: "Quand un titre de séjour est utile pour un étudiant et les étapes après le RVP." },
    { title: "ВНЖ — إقامة طويلة", excerpt: "متى يستحق الطالب التفكير في ВНЖ وما الخطوات بعد РВП." },
    { title: "ВНЖ 居留证", excerpt: "学生何时值得办理居留证，以及РВП之后的常见步骤。" },
  ),
  "mandatory-expenses": pack(
    { title: "Обязательные расходы иностранного студента", excerpt: "Какие платежи нельзя откладывать: учёба, страховка, жильё и миграционные сборы." },
    { title: "Mandatory expenses for international students", excerpt: "Payments you cannot postpone: tuition, insurance, housing, and migration fees." },
    { title: "Dépenses obligatoires de l’étudiant étranger", excerpt: "Frais à ne pas reporter : études, assurance, logement et taxes migratoires." },
    { title: "النفقات الإلزامية للطالب الأجنبي", excerpt: "مدفوعات لا تؤجَّل: الدراسة والتأمين والسكن ورسوم الهجرة." },
    { title: "国际学生的必要开支", excerpt: "不能拖延的费用：学费、保险、住宿和移民相关收费。" },
  ),
  "insurance-dms": pack(
    { title: "Медицинская страховка (ДМС)", excerpt: "Какая страховка нужна иностранному студенту и что проверить в полисе ДМС." },
    { title: "Health insurance (DMS)", excerpt: "Which insurance an international student needs and what to check in a DMS policy." },
    { title: "Assurance maladie (DMS)", excerpt: "Quelle assurance un étudiant étranger doit avoir et que vérifier sur le contrat DMS." },
    { title: "التأمين الطبي (ДМС)", excerpt: "أي تأمين يحتاجه الطالب الأجنبي وما الذي تتحقق منه في وثيقة ДМС." },
    { title: "医疗保险（ДМС）", excerpt: "国际学生需要哪种保险，以及商业医疗保险合同里要核对什么。" },
  ),
  "medical-checkup": pack(
    { title: "Медицинский осмотр для иностранцев", excerpt: "Какие справки и медосмотр обычно требуют для учёбы и миграционного учёта." },
    { title: "Medical exam for foreigners", excerpt: "Which certificates and medical exam are usually required for study and registration." },
    { title: "Visite médicale pour étrangers", excerpt: "Quels certificats et examens sont généralement exigés pour les études et l’enregistrement." },
    { title: "الفحص الطبي للأجانب", excerpt: "الشهادات والفحص الطبي المطلوبان غالبًا للدراسة والتسجيل الهجري." },
    { title: "外国人体检", excerpt: "学习和移民登记通常要求哪些体检证明。" },
  ),
  "sim-card": pack(
    { title: "SIM-карта в России", excerpt: "Как купить SIM по паспорту, какие операторы популярны и что нужно для регистрации номера." },
    { title: "SIM card in Russia", excerpt: "How to buy a SIM with your passport, popular operators, and what registration requires." },
    { title: "Carte SIM en Russie", excerpt: "Acheter une SIM avec le passeport, opérateurs courants et formalités d’enregistrement." },
    { title: "شريحة SIM في روسيا", excerpt: "كيف تشتري شريحة بجواز السفر وأبرز الشركات وما يلزم لتسجيل الرقم." },
    { title: "俄罗斯手机卡", excerpt: "如何凭护照买卡、常见运营商，以及登记号码需要什么。" },
  ),
  "daily-life": pack(
    { title: "Быт в первый месяц", excerpt: "Продукты, ЖКХ, прачечная и привычный ритм города в первые недели после заезда." },
    { title: "Daily life in the first month", excerpt: "Groceries, utilities, laundry, and getting used to the city in your first weeks." },
    { title: "Le quotidien le premier mois", excerpt: "Courses, charges, lessive et rythme de la ville pendant les premières semaines." },
    { title: "الحياة اليومية في الشهر الأول", excerpt: "المشتريات والخدمات والغسيل والتعوّد على إيقاع المدينة في الأسابيع الأولى." },
    { title: "第一个月的日常生活", excerpt: "到校后几周内的购物、水电、洗衣和适应城市节奏。" },
  ),
  "social-adapt": pack(
    { title: "Социальная адаптация", excerpt: "Как искать друзей, кружки и сообщества, не оставаясь один в новой стране." },
    { title: "Social adaptation", excerpt: "How to find friends, clubs, and communities so you are not alone in a new country." },
    { title: "Adaptation sociale", excerpt: "Trouver des amis, des clubs et des communautés pour ne pas rester isolé." },
    { title: "التكيف الاجتماعي", excerpt: "كيف تجد أصدقاء وأندية ومجتمعات حتى لا تبقى وحدك في بلد جديد." },
    { title: "社会适应", excerpt: "如何结识朋友、社团和社区，避免在陌生国家孤立。" },
  ),
  "russian-holidays": pack(
    { title: "Государственные праздники России", excerpt: "Когда в России выходные, что закрыто в праздники и как спланировать дела." },
    { title: "Public holidays in Russia", excerpt: "When Russia has public holidays, what is closed, and how to plan around them." },
    { title: "Jours fériés en Russie", excerpt: "Quand la Russie chôme, ce qui ferme, et comment s’organiser." },
    { title: "العطل الرسمية في روسيا", excerpt: "متى تكون العطل الرسمية وما يُغلق وكيف تخطط أمورك." },
    { title: "俄罗斯法定假日", excerpt: "俄罗斯何时放假、哪些机构关门，以及如何安排事务。" },
  ),
  "russian-cultural-code": pack(
    { title: "Культурный код России", excerpt: "Нормы общения, очереди, обращения на «вы» и то, что часто удивляет иностранцев." },
    { title: "Russia’s cultural code", excerpt: "Communication norms, queues, formal address, and what often surprises newcomers." },
    { title: "Code culturel de la Russie", excerpt: "Normes de communication, files d’attente, vouvoiement : ce qui surprend souvent." },
    { title: "الشفرة الثقافية لروسيا", excerpt: "قواعد التواصل والطوابير والمخاطبة الرسمية وما يفاجئ الأجانب غالبًا." },
    { title: "俄罗斯文化习惯", excerpt: "交流方式、排队、敬称，以及外国人常感到意外的地方。" },
  ),
  "visa-vs-visa-free": pack(
    { title: "Визовые и безвизовые студенты: в чём разница", excerpt: "Чем статус визового студента отличается от безвизового: сроки, регистрация и документы." },
    { title: "Visa vs visa-free students: the difference", excerpt: "How visa and visa-free student status differ: deadlines, registration, and paperwork." },
    { title: "Étudiants avec ou sans visa : la différence", excerpt: "Statut avec visa ou sans visa : délais, enregistrement et documents." },
    { title: "طلاب بتأشيرة وبدون تأشيرة: الفرق", excerpt: "كيف يختلف وضع الطالب بتأشيرة عن غيره: المهل والتسجيل والأوراق." },
    { title: "签证与免签学生有何不同", excerpt: "有签证和无签证学生在期限、登记和材料上的差别。" },
  ),
  "study-visa-extend": pack(
    { title: "Как получить и продлить учебную визу", excerpt: "Первая учебная виза и продление: какие бумаги готовит вуз и какие сроки критичны." },
    { title: "How to get and extend a student visa", excerpt: "First student visa and extension: papers the university prepares and critical deadlines." },
    { title: "Obtenir et prolonger un visa étudiant", excerpt: "Premier visa et prolongation : dossiers de l’université et délais critiques." },
    { title: "الحصول على تأشيرة الدراسة وتمديدها", excerpt: "التأشيرة الأولى والتمديد: ما تجهّزه الجامعة والمهل الحرجة." },
    { title: "如何办理和延长学生签证", excerpt: "首次学生签证与延期：大学准备哪些材料、哪些截止日期不能错过。" },
  ),
  "migration-rereg": pack(
    { title: "Повторная миграционная регистрация", excerpt: "Когда нужно заново встать на учёт: смена адреса, поездка и что принести в МФЦ или вуз." },
    { title: "Repeat migration registration", excerpt: "When you must register again: address change, travel, and what to bring to MFC or university." },
    { title: "Réenregistrement migratoire", excerpt: "Quand se réenregistrer : changement d’adresse, voyage, pièces pour le MFC ou l’université." },
    { title: "إعادة التسجيل الهجري", excerpt: "متى يجب التسجيل من جديد: تغيير العنوان والسفر وما تحمله إلى MFC أو الجامعة." },
    { title: "再次办理移民登记", excerpt: "何时必须重新登记：搬家、出行，以及带到多功能中心或大学的材料。" },
  ),
  "biometrics-medexam": pack(
    { title: "Дактилоскопия, фотографирование и обязательный медосмотр", excerpt: "Какие биометрические процедуры и медосмотр обязательны и в какие сроки их пройти." },
    { title: "Fingerprints, photos, and mandatory medical exam", excerpt: "Which biometric procedures and medical exam are mandatory, and the deadlines to complete them." },
    { title: "Empreintes, photos et visite médicale obligatoire", excerpt: "Quelles procédures biométriques et examens sont obligatoires, et dans quels délais." },
    { title: "البصمات والصور والفحص الطبي الإلزامي", excerpt: "أي إجراءات بيومترية وفحص طبي إلزامية وفي أي مهلة تُنجز." },
    { title: "指纹、拍照与强制体检", excerpt: "哪些生物识别和体检是强制的，以及必须在多久内完成。" },
  ),
  "ru-id": pack(
    { title: "RU ID: что это и кому он нужен", excerpt: "Что такое RU ID, кому его оформляют и как он связан с Госуслугами." },
    { title: "RU ID: what it is and who needs it", excerpt: "What RU ID is, who gets it, and how it connects to Gosuslugi." },
    { title: "RU ID : à quoi ça sert", excerpt: "Ce qu’est le RU ID, qui le reçoit et le lien avec Gosuslugi." },
    { title: "RU ID: ما هو ومن يحتاجه", excerpt: "ما هو RU ID ومن يُصدَّر له وكيف يرتبط بمنصة Госуслуги." },
    { title: "RU ID 是什么、谁需要", excerpt: "RU ID的含义、适用对象，以及它与国家公共服务的关系。" },
  ),
  "work-while-studying": pack(
    { title: "Работа во время учёбы", excerpt: "Можно ли работать на учебной визе, какие ограничения и что проверить в договоре." },
    { title: "Working while studying", excerpt: "Whether you can work on a student visa, the limits, and what to check in a contract." },
    { title: "Travailler pendant les études", excerpt: "Travailler avec un visa étudiant : limites et points à vérifier dans le contrat." },
    { title: "العمل أثناء الدراسة", excerpt: "هل يجوز العمل بتأشيرة دراسة وما القيود وما تراجعه في العقد." },
    { title: "学习期间打工", excerpt: "持学生签证能否工作、有哪些限制，以及合同里要核对什么。" },
  ),
  "police-safety": pack(
    { title: "Безопасность и общение с полицией", excerpt: "Как вести себя при проверке документов, какие бумаги носить с собой и куда звонить." },
    { title: "Safety and dealing with police", excerpt: "How to handle ID checks, which papers to carry, and who to call." },
    { title: "Sécurité et rapports avec la police", excerpt: "Contrôles d’identité : quels papiers avoir sur soi et qui appeler." },
    { title: "السلامة والتعامل مع الشرطة", excerpt: "كيف تتصرف عند فحص الوثائق وما الأوراق تحملها ومع من تتصل." },
    { title: "安全与警察沟通", excerpt: "查验证件时如何应对、身上要带哪些文件、该打给谁。" },
  ),
  "student-full-budget": pack(
    { title: "Полный бюджет иностранного студента", excerpt: "Сколько примерно уходит на жильё, еду, связь и учёбу — ориентиры, не реклама банков." },
    { title: "Full budget for an international student", excerpt: "Rough costs for housing, food, mobile, and study — planning figures, not bank ads." },
    { title: "Budget complet d’un étudiant étranger", excerpt: "Ordres de grandeur pour logement, nourriture, forfait et études." },
    { title: "ميزانية الطالب الأجنبي الكاملة", excerpt: "تقديرات السكن والطعام والاتصال والدراسة — أرقام تخطيط لا إعلانات بنوك." },
    { title: "国际学生完整预算", excerpt: "住宿、饮食、话费和学业的大致开销——规划数字，不是银行广告。" },
  ),
  "gosuslugi-foreign-student": pack(
    { title: "Госуслуги для иностранного студента", excerpt: "Как создать подтверждённую учётную запись и какие услуги реально нужны студенту." },
    { title: "Gosuslugi for international students", excerpt: "How to create a verified account and which services students actually need." },
    { title: "Gosuslugi pour étudiants étrangers", excerpt: "Créer un compte vérifié et les services vraiment utiles à un étudiant." },
    { title: "Госуслуги للطالب الأجنبي", excerpt: "كيف تنشئ حسابًا موثّقًا وأي خدمات يحتاجها الطالب فعلًا." },
    { title: "国际学生使用国家公共服务", excerpt: "如何创建已验证账号，以及学生真正用得到的服务。" },
  ),
};

export const EDUCATION_GUIDE_COPY: Record<string, Record<Language, GuideCopy>> = {
  "slang-dictionary": pack(
    { title: "Словарь студенческого сленга", excerpt: "Короткий словарь пар, зачётов и сленга вуза — чтобы понимать однокурсников и деканат." },
    { title: "Student slang dictionary", excerpt: "A short glossary of classes, pass/fail tests, and campus slang." },
    { title: "Dictionnaire de l’argot étudiant", excerpt: "Petit lexique des cours, crédits et argot du campus." },
    { title: "قاموس عامية الطلاب", excerpt: "معجم قصير للمحاضرات والاختبارات وعامية الجامعة." },
    { title: "学生俚语词典", excerpt: "课堂、考查和校园口语的短词汇，方便听懂同学和教务处。" },
  ),
  "0-main": pack(
    { title: "Как проходит обучение в российском вузе", excerpt: "Семестры, лекции, сессия и к кому идти, если что-то непонятно в учёбе." },
    { title: "How studying works at a Russian university", excerpt: "Semesters, lectures, exam period, and who to ask when studies are confusing." },
    { title: "Comment se passent les études en Russie", excerpt: "Semestres, cours, session d’examens et vers qui se tourner." },
    { title: "كيف تسير الدراسة في جامعة روسية", excerpt: "الفصول والمحاضرات ودورة الامتحانات وإلى من تلجأ إذا التبس الأمر." },
    { title: "俄罗斯大学如何上课", excerpt: "学期、讲座、考试周，以及学习上有疑问该找谁。" },
  ),
  "0": pack(
    { title: "Разница между экзаменом и зачётом", excerpt: "Чем экзамен отличается от зачёта, как ставят оценку и что будет при незачёте." },
    { title: "Exam vs pass/fail credit", excerpt: "How an exam differs from a pass/fail credit, how grades work, and what a fail means." },
    { title: "Différence entre examen et crédit", excerpt: "Examen noté vs contrôle sans note, barème et conséquence d’un échec." },
    { title: "الفرق بين الامتحان والـ зачёт", excerpt: "كيف يختلف الامتحان عن الاجتياز بدون درجة وماذا يحدث عند الرسوب." },
    { title: "考试与考查的区别", excerpt: "考试和及格考查有何不同、如何打分，以及不及格会怎样。" },
  ),
  "1": pack(
    { title: "Как сдать сессию в российском вузе", excerpt: "Когда бывает зимняя и летняя сессия, как готовиться и что делать при пересдаче." },
    { title: "How to pass exam period at a Russian university", excerpt: "When winter and summer sessions happen, how to prepare, and what retakes look like." },
    { title: "Réussir la session d’examens", excerpt: "Sessions d’hiver et d’été, préparation et rattrapages." },
    { title: "كيف تجتاز فترة الامتحانات", excerpt: "متى تكون دورة الشتاء والصيف وكيف تستعد وماذا عن الإعادة." },
    { title: "如何度过俄罗斯大学的考试周", excerpt: "冬夏考试周何时开始、怎么准备，以及补考怎么安排。" },
  ),
  "2": pack(
    { title: "Что такое ГОСТ и как его использовать", excerpt: "ГОСТ — правила оформления курсовых и дипломов. Что обычно проверяет кафедра." },
    { title: "What GOST is and how to use it", excerpt: "GOST is the formatting standard for papers. What departments usually check." },
    { title: "Qu’est-ce que le GOST", excerpt: "Norme de présentation des mémoires et ce que le département contrôle." },
    { title: "ما هو ГОСТ وكيف تستخدمه", excerpt: "معيار تنسيق الأعمال الفصلية وما تراجعه القسم عادة." },
    { title: "什么是GOST以及如何使用", excerpt: "课程论文和毕业论文的格式标准，教研室通常检查什么。" },
  ),
  "3": pack(
    { title: "Структура вуза: кафедры, деканаты, ректорат", excerpt: "Кто такой ректор, декан и завкафедрой — и куда идти с разными вопросами." },
    { title: "University structure: departments and dean’s office", excerpt: "Who the rector, dean, and department head are — and where to go with different questions." },
    { title: "Structure de l’université", excerpt: "Recteur, doyen, chef de chaire : à qui s’adresser selon la question." },
    { title: "هيكل الجامعة: الأقسام والعمداء", excerpt: "من هو مدير الجامعة والعميد ورئيس الكرسي وإلى أين تذهب حسب السؤال." },
    { title: "大学结构：教研室、学院、校长办公室", excerpt: "校长、院长、教研室主任分别是谁，不同类型问题该找谁。" },
  ),
  "4": pack(
    { title: "Как писать курсовую работу", excerpt: "Как выбрать тему, согласовать её с научным руководителем и собрать работу по ГОСТ." },
    { title: "How to write a course paper", excerpt: "How to pick a topic, agree it with your supervisor, and format the paper to GOST." },
    { title: "Rédiger un travail de cours", excerpt: "Choisir le sujet, le valider avec le directeur et respecter le GOST." },
    { title: "كيف تكتب بحثًا فصليًا", excerpt: "اختيار الموضوع والاتفاق مع المشرف وتنسيق العمل وفق ГОСТ." },
    { title: "如何写课程论文", excerpt: "如何选题、与导师确认，并按GOST完成论文。" },
  ),
  "5": pack(
    { title: "Что делать при незачёте", excerpt: "Незачёт — не конец учёбы. Как узнать дату пересдачи и не пропустить срок." },
    { title: "What to do if you fail a credit", excerpt: "A failed credit is not the end. How to find the retake date and not miss the deadline." },
    { title: "Que faire en cas d’échec au crédit", excerpt: "Un échec n’arrête pas les études. Date de rattrapage et délais à ne pas manquer." },
    { title: "ماذا تفعل عند الرسوب في зачёт", excerpt: "الرسوب ليس نهاية الدراسة. كيف تعرف موعد الإعادة ولا تفوّت المهلة." },
    { title: "考查不及格怎么办", excerpt: "不及格不是退学。如何确认补考日期并赶上截止日期。" },
  ),
  "6": pack(
    { title: "Академический отпуск: когда и как", excerpt: "Когда можно взять академический отпуск, какие справки нужны и что будет с визой." },
    { title: "Academic leave: when and how", excerpt: "When you can take academic leave, which certificates you need, and what happens to your visa." },
    { title: "Congé académique : quand et comment", excerpt: "Conditions, certificats et conséquences pour le visa." },
    { title: "الإجازة الأكاديمية: متى وكيف", excerpt: "متى تُمنح الإجازة الأكاديمية وما الشهادات وماذا يحدث للتأشيرة." },
    { title: "休学：何时以及如何办理", excerpt: "何时可以休学、需要哪些证明，以及对签证的影响。" },
  ),
  "edu-academic-docs": pack(
    { title: "Учебные справки и документы вуза", excerpt: "Справка об обучении, выписка оценок и другие бумаги, которые просят банки и миграция." },
    { title: "University certificates and documents", excerpt: "Enrollment letters, transcripts, and other papers banks and migration offices ask for." },
    { title: "Attestations et documents de l’université", excerpt: "Certificat de scolarité, relevé de notes et papiers demandés par banques et migration." },
    { title: "شهادات ووثائق الجامعة", excerpt: "إفادة الدراسة وكشف الدرجات وأوراق تطلبها البنوك والهجرة." },
    { title: "大学学习证明与文件", excerpt: "在读证明、成绩单，以及银行和移民部门常要的材料。" },
  ),
  "expulsion-academic": pack(
    { title: "Академическая неуспеваемость", excerpt: "За какие долги по учёбе могут отчислить и что сделать до приказа." },
    { title: "Academic failure and expulsion risk", excerpt: "Which academic debts can lead to expulsion and what to do before the order is signed." },
    { title: "Échec académique", excerpt: "Quelles dettes d’études mènent à l’exclusion et que faire avant l’arrêté." },
    { title: "التعثر الأكاديمي", excerpt: "أي ديون دراسية قد تؤدي إلى الفصل وما العمل قبل صدور القرار." },
    { title: "学业不及格与退学风险", excerpt: "哪些学业欠账可能导致退学，以及命令下达前能做什么。" },
  ),
  "expulsion-attendance": pack(
    { title: "Пропуски занятий", excerpt: "Сколько пропусков опасно, как закрыть их справкой и кого предупредить." },
    { title: "Missing classes", excerpt: "How many absences are risky, how to cover them with a certificate, and whom to notify." },
    { title: "Absences aux cours", excerpt: "Seuil risqué, justificatifs et personnes à prévenir." },
    { title: "الغياب عن الحصص", excerpt: "كم غيابات تُعد خطرة وكيف تغطيها بشهادة ومن تُبلغ." },
    { title: "旷课", excerpt: "缺课到什么程度危险、如何用证明销假，以及该通知谁。" },
  ),
  "expulsion-migration": pack(
    { title: "Нарушение миграционных правил", excerpt: "Просроченный учёт или виза могут привести к отчислению. Что проверить заранее." },
    { title: "Breaking migration rules", excerpt: "Expired registration or visa can lead to expulsion. What to check in advance." },
    { title: "Infraction aux règles migratoires", excerpt: "Enregistrement ou visa périmé : risque d’exclusion. Que vérifier tôt." },
    { title: "مخالفة قواعد الهجرة", excerpt: "انتهاء التسجيل أو التأشيرة قد يؤدي إلى الفصل. ما تراجعه مسبقًا." },
    { title: "违反移民规定", excerpt: "登记或签证过期可能导致退学。提前检查什么。" },
  ),
  "expulsion-payment": pack(
    { title: "Если не оплатил обучение вовремя", excerpt: "Что происходит при просрочке оплаты контракта и как договориться о рассрочке." },
    { title: "If you miss a tuition payment", excerpt: "What happens when a contract payment is late and how to ask for an installment plan." },
    { title: "Retard de paiement des études", excerpt: "Conséquences d’un impayé et comment demander un échéancier." },
    { title: "إذا تأخرت عن دفع الرسوم", excerpt: "ماذا يحدث عند تأخر دفعة العقد وكيف تطلب تقسيطًا." },
    { title: "学费逾期未缴", excerpt: "合同学费逾期会怎样，以及如何申请分期。" },
  ),
  "expulsion-disciplinary": pack(
    { title: "Дисциплинарные нарушения", excerpt: "За что отчисляют по дисциплине и как проходит служебная проверка." },
    { title: "Disciplinary violations", excerpt: "What disciplinary issues lead to expulsion and how an internal review works." },
    { title: "Faute disciplinaire", excerpt: "Motifs d’exclusion disciplinaire et déroulement de l’enquête interne." },
    { title: "المخالفات التأديبية", excerpt: "ما المخالفات التي تؤدي إلى الفصل وكيف يسير التحقيق الداخلي." },
    { title: "纪律处分", excerpt: "哪些纪律问题会导致退学，以及内部调查如何进行。" },
  ),
  "edu-reinstatement": pack(
    { title: "Восстановление для продолжения обучения", excerpt: "Как восстановиться после отчисления: сроки, документы и что будет с визой." },
    { title: "Reinstatement to continue studies", excerpt: "How to be reinstated after expulsion: deadlines, papers, and what happens to your visa." },
    { title: "Réintégration pour continuer les études", excerpt: "Se réinscrire après exclusion : délais, documents et visa." },
    { title: "إعادة القيد لمواصلة الدراسة", excerpt: "كيف تعود بعد الفصل: المهل والأوراق وماذا يحدث للتأشيرة." },
    { title: "退学后复学", excerpt: "开除后如何恢复学籍：期限、材料以及对签证的影响。" },
  ),
  "edu-apply-university": pack(
    { title: "Как подать документы в российский вуз", excerpt: "Квота, контракт и список документов для поступления — без лишнего канцелярита." },
    { title: "How to apply to a Russian university", excerpt: "Quota vs paid track and the document list for admission, without the jargon." },
    { title: "Candidater dans une université russe", excerpt: "Quota, contrat payant et liste de pièces pour l’admission." },
    { title: "كيف تقدّم أوراقك لجامعة روسية", excerpt: "الحصة والعقد المدفوع وقائمة المستندات للقبول بلا تعقيد زائد." },
    { title: "如何向俄罗斯大学递交材料", excerpt: "配额、自费以及入学材料清单，少一些公文套话。" },
  ),
};

export function getGuideCopy(
  section: "life" | "education",
  id: string,
  language: Language,
): GuideCopy | undefined {
  const table = section === "life" ? LIFE_GUIDE_COPY : EDUCATION_GUIDE_COPY;
  const byLang = table[id];
  if (!byLang) return undefined;
  return byLang[language] || byLang[Language.RU];
}

export function localizedGuideFields(
  guide: Pick<Guide, "id" | "category" | "title">,
  language: Language,
  section?: "life" | "education",
): GuideCopy {
  const resolved =
    section ??
    (guide.category === GuideCategory.EDUCATION ? "education" : "life");
  return (
    getGuideCopy(resolved, guide.id, language) ?? {
      title: guide.title,
      excerpt: "",
    }
  );
}
