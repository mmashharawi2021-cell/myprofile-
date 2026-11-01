import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { ArrowDown, ArrowLeft, ArrowUpLeft, BriefcaseBusiness, CheckCircle2, ChevronLeft, Download, GraduationCap, Github, Globe2, Mail, MapPin, Moon, Printer, Sparkles, Sun } from "lucide-react";
import cv from "./data.json";
import "../styles.css";
import "./cv.css";

const base = import.meta.env.BASE_URL;
const pdf = base + "cv/Mohanad-Almashharawi-CV.pdf";

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="cv-section-heading cv-reveal"><span className="cv-eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>;
}
function App() {
  const [language, setLanguage] = useState<"ar" | "en">(() => {
    try { return localStorage.getItem("portfolio-cv-language") === "en" ? "en" : "ar"; } catch { return "ar"; }
  });
  const suffix = language === "ar" ? "Ar" : "En";
  const t = cv.ui[language];
  const mainRef = useRef<HTMLElement>(null);
  const previousLanguage = useRef(language);
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", cv[`summary${suffix}`]);
    try { localStorage.setItem("portfolio-cv-language", language); } catch {}
    if (previousLanguage.current !== language && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mainRef.current?.animate?.([{ opacity: 0.45 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
    }
    previousLanguage.current = language;
  }, [language, suffix, t]);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("portfolio-theme-choice") === "light" ? "light" : "dark"; } catch { return "dark"; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem("portfolio-theme-choice", mode); } catch {}
  }, [mode]);
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".cv-reveal"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("cv-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.1, rootMargin: "0px 0px -28px 0px" });
    elements.forEach((element) => observer.observe(element));
    document.querySelector(".cv-shell")?.classList.add("cv-motion-ready");
    return () => observer.disconnect();
  }, []);
  return <div className="cv-shell">
    <a className="skip-link" href="#cv-main">{t.skip}</a>
    <header className="cv-topbar">
      <a className="cv-home" href={base} aria-label={t.homeLabel}><span className="cv-home-mark">M</span><span>{t.shortName} <small>{t.brand}</small></span></a>
      <div className="cv-top-actions">
        <button type="button" className="cv-language" lang={language === "ar" ? "en" : "ar"} aria-label={t.switchLanguage} onClick={() => setLanguage(language === "ar" ? "en" : "ar")}>{t.languageName}</button>
        <a href={base} className="cv-nav-back"><ArrowLeft size={16} aria-hidden="true" /> {t.home}</a>
        <button className="cv-theme" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label={mode === "dark" ? t.light : t.dark}>{mode === "dark" ? <Sun size={19}/> : <Moon size={19}/>}</button>
      </div>
    </header>
    <main ref={mainRef} id="cv-main" tabIndex={-1}>
      <section className="cv-hero" aria-labelledby="cv-name">
        <div className="cv-glow cv-glow-a" aria-hidden="true"/><div className="cv-glow cv-glow-b" aria-hidden="true"/>
        <div className="cv-hero-inner">
          <div className="cv-hero-copy cv-reveal">
            <span className="cv-kicker"><span className="cv-live-dot"/> {t.kicker}</span>
            <p className="cv-overline">{t.hello}</p>
            <h1 id="cv-name">{cv[`name${suffix}`]}</h1>
            <p className="cv-title">{cv[`role${suffix}`]}</p>
            <p className="cv-intro">{cv[`summary${suffix}`]}</p>
            <div className="cv-actions">
              <a className="cv-btn cv-btn-primary" href={pdf} download="Mohanad-Almashharawi-CV.pdf"><Download size={18} aria-hidden="true"/> {t.download}</a>
              <button type="button" className="cv-btn cv-btn-outline" onClick={() => window.print()}><Printer size={18} aria-hidden="true"/> {t.print}</button>
            </div>
            <div className="cv-quick-facts"><span><MapPin size={15} aria-hidden="true"/> {t.location}</span><span><BriefcaseBusiness size={15} aria-hidden="true"/> {t.field}</span></div>
          </div>
          <div className="cv-portrait-side cv-reveal">
            <div className="cv-portrait-frame"><img src={base + "assets/profile-photo.webp"} alt={t.portrait} width="360" height="405" fetchPriority="high" /></div>
            <div className="cv-portrait-float"><CheckCircle2 size={17} aria-hidden="true" /> {t.badge}</div>
          </div>
        </div>
        <a href="#experience" className="cv-scroll"><ArrowDown size={15} aria-hidden="true"/> {t.discover}</a>
      </section>
      <div className="cv-stat-strip" aria-label={t.fields}><span><Globe2 size={19} aria-hidden="true"/> {t.gis}</span><span><BriefcaseBusiness size={19} aria-hidden="true"/> {t.web}</span><span><Sparkles size={19} aria-hidden="true"/> {t.analytics}</span></div>
      <section className="cv-section" id="experience">
        <SectionTitle eyebrow={t.experienceEyebrow} title={t.experienceTitle} copy={t.experienceCopy}/>
        <div className="cv-timeline">
          {cv.experience.map((job, i) => <article className="cv-timeline-item cv-reveal" key={job.roleEn + i} style={{ transitionDelay: (i % 3) * 70 + "ms" }}>
            <div className="cv-timeline-dot" aria-hidden="true"/><div className="cv-job-head"><div><span className="cv-period">{job[`period${suffix}`]}</span><h3>{job[`role${suffix}`]}</h3><p className="cv-org">{job[`company${suffix}`]}</p></div><span className="cv-job-number">{String(i+1).padStart(2,"0")}</span></div>
            <ul>{job[`details${suffix}`].map((detail) => <li key={detail}>{detail}</li>)}</ul>
          </article>)}
        </div>
      </section>
      <section className="cv-section cv-alt" id="skills">
        <SectionTitle eyebrow={t.skillsEyebrow} title={t.skillsTitle} copy={t.skillsCopy}/>
        <div className="cv-skills-grid">{cv.skills.map((group,i) => <article className="cv-skill-card cv-reveal" key={group.titleEn} style={{ transitionDelay: i*90+"ms" }}><div className="cv-skill-counter">{String(i+1).padStart(2,"0")}</div><h3>{group[`title${suffix}`]}</h3><div className="cv-tags">{group[`items${suffix}`].map((item) => <span key={item}>{item}</span>)}</div></article>)}</div>
      </section>
      <section className="cv-section" id="projects">
        <SectionTitle eyebrow={t.projectsEyebrow} title={t.projectsTitle} copy={t.projectsCopy}/>
        <div className="cv-projects-grid">{cv.projects.map((project,i) => <article className="cv-project-card cv-reveal" key={project.titleEn} style={{ transitionDelay: (i%2)*90+"ms" }}><span className="cv-project-label">{project[`label${suffix}`]}</span><h3>{project[`title${suffix}`]}</h3><p>{project[`description${suffix}`]}</p><span className="cv-project-index">0{i+1}</span></article>)}</div>
        <a className="cv-more-work" href={base + "#projects"}>{t.more} <ChevronLeft size={17} aria-hidden="true"/></a>
      </section>
      <section className="cv-section cv-alt" id="education">
        <SectionTitle eyebrow={t.educationEyebrow} title={t.educationTitle} />
        <div className="cv-education-grid">{cv.education.map((study) => <article className="cv-study cv-reveal" key={study.degreeEn}><GraduationCap size={26} aria-hidden="true" /><div><h3>{study[`degree${suffix}`]}</h3><p>{study[`school${suffix}`]}</p><span>{study[`detail${suffix}`]}</span></div></article>)}</div>
        <p className="cv-extra cv-reveal">{cv[`certificate${suffix}`]}</p>
        <div className="cv-languages cv-reveal"><strong>{t.languages}</strong>{cv[`languages${suffix}`].map((l) => <span key={l}>{l}</span>)}</div>
      </section>
      <section className="cv-contact cv-reveal" id="contact"><span className="cv-eyebrow">{t.connect}</span><h2>{t.contactTitle}</h2><p>{t.contactCopy}</p><div className="cv-contact-links"><a href={"mailto:" + cv.email}><Mail size={18}/> {t.email}</a><a href={cv.linkedin} target="_blank" rel="noopener noreferrer">{t.linkedin} <ArrowUpLeft size={16}/></a><a href={cv.github} target="_blank" rel="noopener noreferrer"><Github size={18}/> {t.github}</a></div></section>
    </main>
    <footer className="cv-footer"><span>© 2026 · {cv[`name${suffix}`]}</span><a href={base}>{t.back} <ArrowLeft size={15} /></a></footer>
  </div>;
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<React.StrictMode><App/></React.StrictMode>);
