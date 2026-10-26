export type Project = {
  title: string;
  type: string;
  status: string;
  imageNo: string;
  desc: string;
  value: string;
  tech: string[];
  link?: string;
};

export const email = "mmashharawi2021@gmail.com";
const whatsappNumber = "970568876261";
export const base = import.meta.env.BASE_URL || "/";
export const imagePath = (imageNo: string) =>
  `${base}assets/projects/${imageNo}.webp`;
export const whatsapp = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
export const generalWhatsApp = whatsapp(
  "مرحبًا مهند، شاهدت موقعك الشخصي وأرغب بمناقشة فكرة مشروع.",
);

export const nav = [
  ["#home", "الرئيسية"],
  ["#services", "الخدمات"],
  ["#projects", "الأعمال"],
  ["#skills", "المهارات"],
  ["#contact", "تواصل"],
];

// لتبديل الصور يدويًا غيّر imageNo فقط. الصور موجودة هنا: app/public/assets/projects/01.webp ... 14.webp
export const projects: Project[] = [
  {
    title: "نظام تقارير تشغيل وضخ المياه",
    type: "Web System",
    status: "قيد التطوير",
    imageNo: "01",
    desc: "نظام عربي لإدارة تقارير التشغيل اليومية، الوقود، الإنتاج، الفحوصات، الجهات المستفيدة، والأرشيف.",
    value:
      "تحويل التقارير اليومية من نصوص وملفات متفرقة إلى لوحة تشغيل قابلة للتصدير والمتابعة.",
    tech: ["React", "TypeScript", "Firebase", "Reports"],
    link: "https://fridge-oracle-sza.web.app/",
  },
  {
    title: "لوحة متابعة الحصر الميداني GIS",
    type: "GIS Platform",
    status: "مكتمل / خاص",
    imageNo: "03",
    desc: "خريطة تفاعلية لمتابعة المناطق والمباني ونسب الإنجاز مع فلاتر وإحصائيات وتصدير.",
    value: "تحويل البيانات الميدانية إلى رؤية مكانية واضحة للإدارة.",
    tech: ["GIS", "Maps", "Analytics", "Leaflet"],
  },
  {
    title: "AmanCare",
    type: "Storefront",
    status: "نموذج أولي",
    imageNo: "06",
    desc: "واجهة متجر عربية لعرض المنتجات بطريقة هادئة ومنظمة مع تجربة طلب واضحة ومباشرة.",
    value: "واجهة تجارية تركّز على الخصوصية والثقة وسهولة الطلب.",
    tech: ["Storefront", "RTL", "UX", "Products"],
  },
  {
    title: "منصة الساعي للخير",
    type: "Charity Platform",
    status: "نموذج أولي",
    imageNo: "08",
    desc: "منصة خيرية عربية/إنجليزية لعرض فكرة الكفالة والتبرع بواجهة واضحة ومؤثرة.",
    value: "بناء الثقة وتسهيل قرار التبرع من أول زيارة.",
    tech: ["Charity", "Landing", "Bilingual", "Dark/Light"],
  },
  {
    title: "تجربة GIS متقدمة",
    type: "GIS UX",
    status: "مكتمل / خاص",
    imageNo: "11",
    desc: "شاشات دخول وتحميل ومحرر خرائط وتحكم فني مصممة لتجربة نظام GIS أكثر احترافية.",
    value:
      "النظام لا يقتصر على الخريطة؛ بل يقدم تجربة كاملة من الدخول حتى التحليل.",
    tech: ["Login", "Map Editor", "Field Data", "UX"],
  },
];

export const services = [
  ["أنظمة ويب مخصصة", "إدخال بيانات، أرشفة، صلاحيات، بحث، تقارير، وتصدير."],
  ["داشبوردات تشغيل وإدارة", "لوحات تحكم تعرض المؤشرات المهمة بسرعة."],
  [
    "خرائط GIS تفاعلية",
    "خرائط ويب تعرض الطبقات والبيانات المكانية بطريقة سهلة.",
  ],
  ["واجهات عربية RTL", "تصميم عربي واضح وسريع يناسب الجوال."],
  ["Firebase وقواعد بيانات", "تسجيل دخول، Firestore، صلاحيات، واستضافة."],
  ["تحسين أنظمة موجودة", "إعادة ترتيب الواجهة وتحسين الأداء وتجربة الاستخدام."],
];

export const skills = [
  ["واجهات وتطبيقات ويب", "React, TypeScript, Vite, CSS"],
  ["خرائط و GIS", "ArcGIS Pro, GeoJSON, MapLibre"],
  ["سحابة وقواعد بيانات", "Firebase, Firestore, Auth, Hosting"],
  ["جودة وتجربة استخدام", "RTL UX, Responsive, Performance"],
];
