import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  Braces,
  Check,
  Database,
  ExternalLink,
  Github,
  Layers,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  X,
} from "lucide-react";
import {
  base,
  email,
  generalWhatsApp,
  imagePath,
  nav,
  projects,
  services,
  skills,
  whatsapp,
  type Project,
} from "./data";

const serviceIcons = [Braces, Layers, Map, ArrowUpLeft, Database, Check];
const filters = ["الكل", "GIS والخرائط", "أنظمة الويب", "مواقع ومنصات"];

function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="project-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <button
        className="icon-button dialog-close"
        onClick={onClose}
        aria-label="إغلاق تفاصيل المشروع"
      >
        <X />
      </button>
      <img src={imagePath(project.imageNo)} alt={`واجهة ${project.title}`} />
      <div className="dialog-body">
        <span className="eyebrow">
          {project.type} · {project.status}
        </span>
        <h2 id="project-title">{project.title}</h2>
        <p>{project.desc}</p>
        <p>{project.value}</p>
        <div className="tags">
          {project.tech.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
        <div className="actions">
          {project.link && (
            <a
              className="button primary"
              href={project.link}
              target="_blank"
              rel="noreferrer"
            >
              معاينة المشروع <ExternalLink size={17} />
            </a>
          )}
          <a
            className="button secondary"
            href={whatsapp(
              `مرحبًا مهند، أرغب بمناقشة مشروع مشابه لـ ${project.title}.`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            ناقش مشروعًا مشابهًا <MessageCircle size={17} />
          </a>
        </div>
      </div>
    </dialog>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("portfolio-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [selected, setSelected] = useState<Project | null>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      /* Storage is optional. */
    }
  }, [theme]);
  const visibleProjects = projects.filter(
    (p) =>
      filter === "الكل" ||
      (filter === "GIS والخرائط"
        ? p.type.startsWith("GIS")
        : filter === "أنظمة الويب"
          ? p.type === "Web System"
          : !p.type.startsWith("GIS") && p.type !== "Web System"),
  );
  return (
    <>
      <a className="skip-link" href="#main">
        انتقل إلى المحتوى
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a
            href="#home"
            className="brand"
            aria-label="مهند المشهراوي — الرئيسية"
          >
            <span className="brand-symbol">
              <Layers size={25} />
            </span>
            <span>
              مهند المشهراوي<small>GIS & WEB DEVELOPER</small>
            </span>
          </a>
          <nav
            id="main-navigation"
            className={menuOpen ? "desktop-nav is-open" : "desktop-nav"}
            aria-label="القائمة الرئيسية"
          >
            {nav.map(([href, label]) => (
              <a href={href} key={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={
                theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a className="button small primary header-cta" href="#contact">
              لنتحدث <ArrowUpLeft size={16} />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section id="home" className="container hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> من البيانات إلى حلول تصنع فرقًا
            </span>
            <p className="hello">مرحبًا، أنا مهند المشهراوي</p>
            <h1>
              أربط البيانات.
              <br />
              أبني الأنظمة.
              <br />
              <span>وأُبسّط التعقيد.</span>
            </h1>
            <p className="hero-description">
              مهندس نظم معلومات جغرافية ومطور أنظمة ويب. أحوّل البيانات والخرائط
              وإجراءات العمل إلى تجارب رقمية واضحة، وعملية.
            </p>
            <div className="actions">
              <a className="button primary" href="#projects">
                استكشف أعمالي <ArrowLeft size={18} />
              </a>
              <a
                className="text-link"
                href={generalWhatsApp}
                target="_blank"
                rel="noreferrer"
              >
                عندك فكرة مشروع؟ <ArrowUpLeft size={18} />
              </a>
            </div>
            <div className="hero-specialties">
              <span>GIS & Mapping</span>
              <i />
              <span>Web Systems</span>
              <i />
              <span>Dashboards</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-coordinate" dir="ltr">
              31° N / 34° E <span>SPATIAL THINKING</span>
            </div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <svg
              className="terrain"
              viewBox="0 0 520 520"
              fill="none"
              aria-hidden="true"
            >
              <g stroke="currentColor" strokeWidth="1">
                <path d="M-40 230Q70 20 250 95T560 10M-40 255Q80 50 250 120T560 35M-40 280Q90 80 250 145T560 60M-40 305Q100 110 250 170T560 85M-40 330Q110 140 250 195T560 110M-40 355Q120 170 250 220T560 135M-40 380Q130 200 250 245T560 160M-40 405Q140 230 250 270T560 185M-40 430Q150 260 250 295T560 210M-40 455Q160 290 250 320T560 235M-40 480Q170 320 250 345T560 260M-40 505Q180 350 250 370T560 285M-40 530Q190 380 250 395T560 310" />
              </g>
            </svg>
            <div className="identity-card">
              <span className="card-kicker">THE HUMAN BEHIND THE DATA</span>
              <img
                className="portrait"
                src={`${base}profile-photo.svg`}
                alt="مهند المشهراوي"
              />
              <div className="identity-caption">
                <h2>مهند المشهراوي</h2>
                <p>GIS Engineer · Web Developer</p>
              </div>
              <span className="identity-mark">
                <ArrowUpLeft size={22} />
              </span>
            </div>
            <div className="floating-label label-map">
              <Map size={20} />
              <span>
                رؤية مكانية<small>Spatial intelligence</small>
              </span>
            </div>
            <div className="floating-label label-code">
              <Braces size={21} />
              <span>
                حلول عملية<small>Built for real work</small>
              </span>
            </div>
            <span className="visual-bottom">DATA → INSIGHT → IMPACT</span>
          </div>
          <a className="scroll-cue" href="#projects">
            <ArrowDown size={16} /> اكتشف المزيد
          </a>
        </section>
        <div className="expertise-strip">
          <div className="container">
            <span>تقنيات أعمل بها</span>
            <div dir="ltr">
              <b>React</b>
              <b>TypeScript</b>
              <b>ArcGIS Pro</b>
              <b>Firebase</b>
              <b>MapLibre</b>
              <b>GeoJSON</b>
            </div>
          </div>
        </div>
        <section id="projects" className="container section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / أعمال مختارة</span>
              <h2>
                حلول ملموسة.
                <br />
                <span>لكل مشروع حكاية.</span>
              </h2>
            </div>
            <p>
              من إدارة التشغيل إلى التحليل المكاني،
              <br />
              هذه نماذج مما أبنيه بالبيانات والكود.
            </p>
          </div>
          <div className="filters" role="group" aria-label="تصفية المشاريع">
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="projects-grid">
            {visibleProjects.map((project, index) => (
              <article
                key={project.title}
                className={`project-card ${filter === "الكل" && index === 0 ? "featured" : ""}`}
              >
                <button
                  className="project-preview"
                  onClick={() => setSelected(project)}
                  aria-label={`عرض تفاصيل ${project.title}`}
                >
                  <img
                    src={imagePath(project.imageNo)}
                    alt={`واجهة ${project.title}`}
                    loading="lazy"
                  />
                  <span className="preview-action">
                    <ArrowUpLeft size={24} />
                  </span>
                  <span className="project-status">{project.status}</span>
                </button>
                <div className="project-info">
                  <span className="eyebrow" dir="ltr">
                    {project.type}
                  </span>
                  <h3>
                    <button onClick={() => setSelected(project)}>
                      {project.title}
                      <ArrowUpLeft size={23} />
                    </button>
                  </h3>
                  <p>{project.desc}</p>
                  <div className="tags">
                    {project.tech.slice(0, 3).map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="services" className="services-section">
          <div className="container section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">02 / كيف أساعدك</span>
                <h2>
                  بياناتك تستحق
                  <br />
                  <span>أكثر من جدول.</span>
                </h2>
              </div>
              <p>
                حلول مصممة حول طريقة عملك،
                <br />
                من الفكرة إلى نظام قابل للاستخدام.
              </p>
            </div>
            <div className="services-grid">
              {services.map(([title, description], index) => {
                const Icon = serviceIcons[index];
                return (
                  <article className="service" key={title}>
                    <div className="service-top">
                      <Icon size={26} strokeWidth={1.5} />
                      <span>0{index + 1}</span>
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section id="skills" className="container section about-section">
          <div className="about-intro">
            <span className="eyebrow">03 / خلف الحلول</span>
            <h2>
              أفهم البيانات،
              <br />
              <span>وأفكر بالمستخدم.</span>
            </h2>
            <p>
              أجمع بين التحليل المكاني وتطوير الويب لبناء أنظمة تخدم العمل
              اليومي. أبدأ بفهم المشكلة، ثم أنظم البيانات وأصمم تجربة تسهّل
              الوصول إلى المعلومة واتخاذ القرار.
            </p>
            <a
              className="text-link"
              href="https://github.com/mmashharawi2021-cell"
              target="_blank"
              rel="noreferrer"
            >
              تابع عملي على GitHub <Github size={18} />
            </a>
          </div>
          <div className="skills-list">
            {skills.map(([title, description], index) => (
              <div className="skill-row" key={title}>
                <span className="skill-number">0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p dir="ltr">{description}</p>
                </div>
                <ArrowUpLeft size={20} />
              </div>
            ))}
          </div>
        </section>
        <section className="container process-section">
          <span className="eyebrow">من الفكرة إلى التنفيذ</span>
          <div className="process-grid">
            {[
              ["نفهم التحدي", "نحدد المشكلة والبيانات والنتيجة المطلوبة."],
              ["نرسم الحل", "نرتب البيانات ونصمم تجربة واضحة."],
              ["نبني ونختبر", "نطور النظام ونتحقق من سيناريوهات العمل."],
              ["نطلق ونحسّن", "نسلّم تجربة قابلة للاستخدام والتطوير."],
            ].map(([title, description], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="contact" className="container section">
          <div className="contact-panel">
            <div className="contact-copy">
              <span className="eyebrow">
                <span className="status-dot" /> لنبدأ بشيء مفيد
              </span>
              <h2>
                عندك بيانات.
                <br />
                عندك تحدّي.
                <br />
                <span>خلّينا نوجد الحل.</span>
              </h2>
              <p>
                احكِ لي عن فكرتك، أو عن إجراء يأخذ من وقتك كل يوم. نبدأ من هناك.
              </p>
              <a className="email-link" href={`mailto:${email}`}>
                {email}
                <ArrowUpLeft size={19} />
              </a>
              <div className="contact-social">
                <a href={generalWhatsApp} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} /> واتساب
                </a>
                <a
                  href="https://github.com/mmashharawi2021-cell"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={18} /> GitHub
                </a>
                <a href={`mailto:${email}`}>
                  <Mail size={18} /> البريد
                </a>
              </div>
            </div>
            <form
              className="contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                window.open(
                  whatsapp(
                    `مرحبًا مهند، أرغب بمناقشة مشروع.\n\nالاسم / الجهة: ${data.get("name")}\nنوع المشروع: ${data.get("type")}\nالفكرة والتحدي: ${data.get("message")}`,
                  ),
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              <h3>احكِ لي عن مشروعك</h3>
              <label htmlFor="name">
                اسمك أو اسم الجهة
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="كيف أناديك؟"
                  required
                  maxLength={120}
                />
              </label>
              <label htmlFor="type">
                ما الذي تحتاجه؟
                <select id="type" name="type">
                  <option>نظام ويب مخصص</option>
                  <option>خريطة GIS تفاعلية</option>
                  <option>داشبورد وتقارير</option>
                  <option>موقع أو منصة</option>
                  <option>لدي فكرة أخرى</option>
                </select>
              </label>
              <label htmlFor="message">
                فكرتك باختصار
                <textarea
                  id="message"
                  name="message"
                  placeholder="ما التحدي الذي تريد حله؟"
                  required
                  rows={4}
                  maxLength={2000}
                />
              </label>
              <button type="submit" className="button primary">
                نبدأ المحادثة <ArrowUpLeft size={19} />
              </button>
              <small>يفتح واتساب برسالتك لتراجعها وترسلها.</small>
            </form>
          </div>
        </section>
      </main>
      <footer className="container footer">
        <a className="brand" href="#home">
          <span className="brand-symbol">
            <Layers size={21} />
          </span>
          <span>مهند المشهراوي</span>
        </a>
        <span>صُنع بعناية، من البيانات إلى التفاصيل.</span>
        <small>© {new Date().getFullYear()} جميع الحقوق محفوظة</small>
      </footer>
      <nav className="mobile-bottom" aria-label="روابط سريعة">
        <a href="#home">الرئيسية</a>
        <a href="#projects">الأعمال</a>
        <a href="#services">الخدمات</a>
        <a href="#contact">
          لنتحدث <ArrowUpLeft size={14} />
        </a>
      </nav>
      {selected && (
        <ProjectDialog project={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
