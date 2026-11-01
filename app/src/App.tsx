import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import ReferenceIntro from "./ReferenceIntro";
import { approvedLogoSrc } from "./brandAsset";
import ProjectsSection from "./ProjectsSection";
import ProjectDialog from "./ProjectDialog";
import ProgressiveImage from "./ProgressiveImage";
import { useHoverPill } from "./HoverPill";
import { TechBadge } from "./TechBadge";
import { FloatingWords } from "./FloatingWords";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  Braces,
  Check,
  Database,
  Github,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Layers,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Moon,
  Pencil,
  Sun,
  X,
} from "lucide-react";
import { useSite, assetUrl, type Project } from "./content/SiteContent";
const Editor = lazy(() => import("./editor/Editor"));
const icons = {
  code: Braces,
  layers: Layers,
  map: Map,
  arrow: ArrowUpLeft,
  database: Database,
  check: Check,
};
export default function App() {
  const { content: c, whatsapp, generalWhatsApp, connected } = useSite();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("portfolio-theme-choice");
    } catch {
      return null;
    }
  });
  const mode = theme ?? c.theme.defaultMode;
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    try {
      return window.sessionStorage.getItem("portfolio-traced-r13-intro-v2") !== "seen";
    } catch {
      return true;
    }
  });
  const [brandVisible, setBrandVisible] = useState(!showIntro);
  const brandAnchorRef = useRef<HTMLSpanElement>(null);
  const completeIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem("portfolio-traced-r13-intro-v2", "seen");
    } catch { /* Browsers that block session storage can still complete the intro. */ }
    setBrandVisible(true);
    setShowIntro(false);
  }, []);
  const nameParts = c.identity.name.trim().split(/\s+/);
  const givenName = nameParts[0] ?? "مهند";
  const familyName = nameParts.slice(1).join(" ");
  const [menuOpen, setMenuOpen] = useState(false);
  const navPill = useHoverPill<HTMLElement>(undefined, menuOpen);
  const [selected, setSelected] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const first = c.projects[0];
  const socialLinks = [
    { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/mohanad-elmashharawi-a4bb23148", Icon: Linkedin },
    { key: "facebook", label: "Facebook", href: "https://www.facebook.com/share/18ytFS2SDE/", Icon: Facebook },
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/mohanad.mashharawi/", Icon: Instagram },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@mohanad.mashharawi", Icon: Music2 },
    { key: "github", label: c.contact.githubLabel, href: c.identity.github, Icon: Github },
    { key: "whatsapp", label: c.contact.whatsappLabel, href: generalWhatsApp, Icon: MessageCircle },
  ];
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  const toggleTheme = () => {
    const next = mode === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("portfolio-theme-choice", next);
    } catch {}
  };
  useEffect(() => {
    document.title = c.seo.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", c.seo.description);
  }, [c.seo]);
  const heading = (title: string, accent: string) => (
    <h2>
      {title}
      <br />
      <span>{accent}</span>
    </h2>
  );
  const sections: Record<string, React.ReactNode> = {
    home: (
      <section id="home" className="container hero">
        <FloatingWords />
        <div className="hero-copy">
          <p className="hello">{c.hero.greeting}</p>
          <p className="hero-name">{c.identity.name}</p>
          <span className="eyebrow">
            <span className="status-dot" />
            {c.hero.badge}
          </span>
          <h1 className="hero-swap">
            <span className="hero-line">{c.hero.title}</span>
            <br />
            <span className="hero-accent">{c.hero.accent}</span>
          </h1>
          <p className="hero-description">{c.hero.description}</p>
          <div className="actions">
            <a className="button primary" href={c.hero.primaryLink}>
              {c.hero.primaryLabel}
              <ArrowLeft size={18} />
            </a>
            <a
              className="text-link"
              href={generalWhatsApp}
              target="_blank"
              rel="noreferrer"
            >
              {c.hero.secondaryLabel}
              <ArrowUpLeft size={18} />
            </a>
          </div>
          <div className="hero-specialties">
            {c.hero.specialties.map((text, index) => (
              <span key={index}>{text}</span>
            ))}
          </div>
        </div>
        <div className="hero-visual studio-visual">
          <div className="studio-glow" aria-hidden="true" />
          <div className="product-window">
            <div className="window-toolbar">
              <span className="window-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>{c.hero.windowLabel}</span>
              <Layers size={15} />
            </div>
            <button
              className="hero-project-button"
              onClick={() => setSelected(first)}
              aria-label={`${c.hero.openLabel}: ${first.title}`}
            >
              <ProgressiveImage
                key={first.image}
                src={assetUrl(first.image)}
                alt={first.title}
                eager
              />
              <span className="hero-project-open">
                {c.hero.openLabel}
                <ArrowUpLeft size={17} />
              </span>
            </button>
          </div>
          <div className="glass-note spatial-note">
            <span className="note-icon">
              <Map size={22} />
            </span>
            <div>
              <strong>{c.hero.mapTitle}</strong>
              <small>{c.hero.mapText}</small>
            </div>
          </div>
          <a className="glass-note developer-note cv-entry" href={import.meta.env.BASE_URL + "cv/"} aria-label="اطّلع على السيرة الذاتية لمهند المشهراوي">
            <img src={assetUrl(c.identity.portrait)} alt={c.identity.name} loading="lazy" decoding="async" />
            <div>
              <strong>{c.identity.name}</strong>
              <small>{c.hero.role}</small>
            </div>
            <span className="note-check">
              <Check size={14} />
            </span>
          </a>
          <span className="visual-bottom">{c.hero.caption}</span>
        </div>
        <a className="scroll-cue" href="#projects">
          <ArrowDown size={16} />
          {c.hero.scrollLabel}
        </a>
      </section>
    ),
    expertise: (
      <div className="expertise-strip">
        <div className="container">
          <span>{c.expertise.label}</span>
          <div dir="ltr">
            {c.expertise.items.map((item, index) => (
              <TechBadge key={index} name={item} />
            ))}
          </div>
        </div>
      </div>
    ),
    projects: <ProjectsSection onSelect={setSelected} />,
    services: (
      <section id="services" className="services-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{c.servicesHeading.label}</span>
              {heading(c.servicesHeading.title, c.servicesHeading.accent)}
            </div>
            <p>{c.servicesHeading.description}</p>
          </div>
          <div className="services-grid">
            {c.services.map((service, index) => {
              const Icon = icons[service.icon as keyof typeof icons] ?? Braces;
              return (
                <article className="service" key={service.id}>
                  <div className="service-top">
                    <Icon size={26} />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    ),
    skills: (
      <section id="skills" className="container section about-section">
        <div className="about-intro">
          <span className="eyebrow">{c.about.label}</span>
          {heading(c.about.title, c.about.accent)}
          <p>{c.about.description}</p>
          <a
            className="text-link"
            href={c.identity.github}
            target="_blank"
            rel="noreferrer"
          >
            {c.about.linkLabel}
            <Github size={18} />
          </a>
        </div>
        <div className="skills-list">
          {c.skills.map((skill, index) => (
            <div className="skill-row" key={skill.id}>
              <span className="skill-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{skill.title}</h3>
                <p dir="auto">{skill.description}</p>
              </div>
              <ArrowUpLeft size={20} />
            </div>
          ))}
        </div>
      </section>
    ),
    process: (
      <section className="container process-section" id="process">
        <span className="eyebrow">{c.process.label}</span>
        <div className="process-grid">
          {c.process.steps.map((step, index) => (
            <article key={step.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    ),
    contact: (
      <section id="contact" className="container section">
        <div className="contact-panel">
          <div className="contact-copy">
            <span className="eyebrow">
              <span className="status-dot" />
              {c.contact.label}
            </span>
            <h2 className="preserve-lines">
              {c.contact.title}
              <br />
              <span>{c.contact.accent}</span>
            </h2>
            <p>{c.contact.description}</p>
            <a className="email-link" href={`mailto:${c.identity.email}`}>
              {c.identity.email}
              <ArrowUpLeft size={19} />
            </a>
            <nav className="contact-social" aria-label="حسابات التواصل الاجتماعي">
              {socialLinks.map(({ key, label, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </a>
              ))}
              <a href={`mailto:${c.identity.email}`}>
                <Mail size={18} aria-hidden="true" />
                {c.contact.emailLabel}
              </a>
            </nav>
          </div>
          <form
            className="contact-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              window.open(
                whatsapp(
                  `مرحبًا مهند، أرغب بالتواصل من خلال موقعك.\n\nالاسم/الجهة: ${data.get("name")}\nنوع الطلب: ${data.get("type")}\nالتفاصيل: ${data.get("message")}`,
                ),
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <h3>{c.contact.formTitle}</h3>
            <label htmlFor="name">
              {c.contact.nameLabel}
              <input
                id="name"
                name="name"
                placeholder={c.contact.namePlaceholder}
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
            <label htmlFor="type">
              {c.contact.typeLabel}
              <select id="type" name="type">
                {c.contact.types.map((type, index) => (
                  <option key={index}>{type}</option>
                ))}
              </select>
            </label>
            <label htmlFor="message">
              {c.contact.messageLabel}
              <textarea
                id="message"
                name="message"
                placeholder={c.contact.messagePlaceholder}
                rows={4}
                required
                maxLength={2000}
              />
            </label>
            <button className="button primary" type="submit">
              {c.contact.submitLabel}
              <ArrowUpLeft size={19} />
            </button>
            <small>{c.contact.note}</small>
          </form>
        </div>
      </section>
    ),
  };
  return (
    <div
      className="site-content"
      style={
        {
          "--site-accent": c.theme.accent,
          "--site-radius": `${c.theme.radius}px`,
          fontFamily: `"${c.theme.font}",sans-serif`,
          fontSize: `${c.theme.fontSize}px`,
        } as React.CSSProperties
      }
    >
      <a className="skip-link" href="#main">
        انتقل إلى المحتوى
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#home" className="brand">
            <span
              ref={brandAnchorRef}
              className={"brand-symbol portfolio-brand-mark" + (brandVisible ? "" : " is-pending")}
            >
              <img src={approvedLogoSrc} alt="" />
            </span>
            <span className="portfolio-brand-text">
              <span className="portfolio-brand-label">
                {givenName}{familyName && <> <span className="portfolio-brand-surname">{familyName}</span></>}
              </span>
              <small>{c.identity.subtitle}</small>
            </span>
          </a>
          <nav
            id="main-navigation"
            className={menuOpen ? "desktop-nav is-open" : "desktop-nav"}
            aria-label="القائمة الرئيسية"
            ref={navPill.ref}
            {...navPill.handlers}
          >
            {navPill.pill}
            {c.navigation.map((link) => (
              <a
                href={link.href}
                key={link.id}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={
                mode === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"
              }
              onClick={toggleTheme}
            >
              {mode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <a className="button small primary header-cta" href="#contact">
              {c.footer.contactLabel}
              <ArrowUpLeft size={16} />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-label="القائمة"
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {c.sections
          .filter((section) => section.visible)
          .map((section) => (
            <div key={section.id}>{sections[section.id]}</div>
          ))}
      </main>
      <footer className="container footer">
        <a className="brand" href="#home">
          <span className="brand-symbol portfolio-brand-mark">
            <img src={approvedLogoSrc} alt="" />
          </span>
          <span>{c.identity.name}</span>
        </a>
        <span>{c.footer.note}</span>
        <nav className="footer-social" aria-label="حسابات التواصل الاجتماعي أسفل الموقع">
          {socialLinks.map(({ key, label, href, Icon }) => (
            <a
              key={key}
              href={href}
              aria-label={label}
              title={label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon size={18} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <small>
          © {new Date().getFullYear()} {c.footer.copyright}
        </small>
      </footer>
      <nav className="mobile-bottom" aria-label="روابط سريعة">
        {c.navigation.slice(0, 4).map((link) => (
          <a key={link.id} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      {selected && (
        <ProjectDialog project={selected} onClose={() => setSelected(null)} />
      )}
      {showIntro && (
        <ReferenceIntro targetRef={brandAnchorRef} onComplete={completeIntro} />
      )}
      {connected && (
        <button
          className="editor-launch"
          onClick={() => setEditing(true)}
        >
          <Pencil size={16} /> تحرير
        </button>
      )}
      {editing && (
        <Suspense
          fallback={
            <div className="editor-loading" role="status">
              جارٍ فتح لوحة التحرير…
            </div>
          }
        >
          <Editor onClose={() => setEditing(false)} />
        </Suspense>
      )}
    </div>
  );
}
