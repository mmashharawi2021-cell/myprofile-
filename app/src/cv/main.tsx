import React, { useEffect, useState } from "react";
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
    <a className="skip-link" href="#cv-main">تخطي إلى السيرة الذاتية</a>
    <header className="cv-topbar">
      <a className="cv-home" href={base} aria-label="العودة إلى الموقع الرئيسي"><span className="cv-home-mark">M</span><span>مهند المشهراوي <small>PORTFOLIO / CV</small></span></a>
      <div className="cv-top-actions">
        <a href={base} className="cv-nav-back"><ArrowLeft size={16} aria-hidden="true" /> الموقع الرئيسي</a>
        <button className="cv-theme" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label={mode === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}>{mode === "dark" ? <Sun size={19}/> : <Moon size={19}/>}</button>
      </div>
    </header>
    <main id="cv-main" tabIndex={-1}>
      <section className="cv-hero" aria-labelledby="cv-name">
        <div className="cv-glow cv-glow-a" aria-hidden="true"/><div className="cv-glow cv-glow-b" aria-hidden="true"/>
        <div className="cv-hero-inner">
          <div className="cv-hero-copy cv-reveal">
            <span className="cv-kicker"><span className="cv-live-dot"/> السيرة الذاتية الرقمية · DIGITAL RESUME</span>
            <p className="cv-overline">مرحبًا، أنا</p>
            <h1 id="cv-name">{cv.nameAr}</h1>
            <p className="cv-title">{cv.roleAr}</p>
            <p className="cv-intro">{cv.summaryAr}</p>
            <div className="cv-actions">
              <a className="cv-btn cv-btn-primary" href={pdf} download="Mohanad-Almashharawi-CV.pdf"><Download size={18} aria-hidden="true"/> تحميل السيرة الذاتية PDF</a>
              <button type="button" className="cv-btn cv-btn-outline" onClick={() => window.print()}><Printer size={18} aria-hidden="true"/> طباعة الصفحة</button>
            </div>
            <div className="cv-quick-facts"><span><MapPin size={15} aria-hidden="true"/> غزة، فلسطين</span><span><BriefcaseBusiness size={15} aria-hidden="true"/> GIS & Web Development</span></div>
          </div>
          <div className="cv-portrait-side cv-reveal">
            <div className="cv-portrait-frame"><img src={base + "assets/profile-photo.webp"} alt="الصورة الشخصية لمهند المشهراوي" width="360" height="405" fetchPriority="high" /></div>
            <div className="cv-portrait-float"><CheckCircle2 size={17} aria-hidden="true" /> GIS · DATA · WEB</div>
          </div>
        </div>
        <a href="#experience" className="cv-scroll"><ArrowDown size={15} aria-hidden="true"/> اكتشف الخبرات</a>
      </section>
      <div className="cv-stat-strip" aria-label="المجالات المهنية"><span><Globe2 size={19} aria-hidden="true"/> نظم المعلومات الجغرافية</span><span><BriefcaseBusiness size={19} aria-hidden="true"/> تطوير الأنظمة</span><span><Sparkles size={19} aria-hidden="true"/> التحليل ولوحات البيانات</span></div>
      <section className="cv-section" id="experience">
        <SectionTitle eyebrow="01 / EXPERIENCE" title="رحلتي المهنية" copy="خبرة عملية تربط جمع البيانات الميدانية بالتدقيق والتحليل والأنظمة الرقمية"/>
        <div className="cv-timeline">
          {cv.experience.map((job, i) => <article className="cv-timeline-item cv-reveal" key={job.roleEn + i} style={{ transitionDelay: (i % 3) * 70 + "ms" }}>
            <div className="cv-timeline-dot" aria-hidden="true"/><div className="cv-job-head"><div><span className="cv-period">{job.periodAr}</span><h3>{job.roleAr}</h3><p className="cv-org">{job.companyAr}</p></div><span className="cv-job-number">{String(i+1).padStart(2,"0")}</span></div>
            <ul>{job.detailsAr.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          </article>)}
        </div>
      </section>
      <section className="cv-section cv-alt" id="skills">
        <SectionTitle eyebrow="02 / EXPERTISE" title="المهارات والأدوات" copy="من معالجة البيانات الجغرافية إلى بناء تطبيقات ويب قابلة للاستخدام"/>
        <div className="cv-skills-grid">{cv.skills.map((group,i) => <article className="cv-skill-card cv-reveal" key={group.titleEn} style={{ transitionDelay: i*90+"ms" }}><div className="cv-skill-counter">{String(i+1).padStart(2,"0")}</div><h3>{group.titleAr}</h3><span className="cv-skill-en">{group.titleEn}</span><div className="cv-tags">{group.items.map((item) => <span key={item}>{item}</span>)}</div></article>)}</div>
      </section>
      <section className="cv-section" id="projects">
        <SectionTitle eyebrow="03 / SELECTED WORK" title="مشاريع مختارة" copy="نماذج من الأنظمة والتجارب التي عملت عليها"/>
        <div className="cv-projects-grid">{cv.projects.map((project,i) => <article className="cv-project-card cv-reveal" key={project.titleEn} style={{ transitionDelay: (i%2)*90+"ms" }}><span className="cv-project-label">{project.label}</span><h3>{project.titleAr}</h3><p>{project.descriptionAr}</p><span className="cv-project-index">0{i+1}</span></article>)}</div>
        <a className="cv-more-work" href={base + "#projects"}>استعرض جميع أعمالي <ChevronLeft size={17} aria-hidden="true"/></a>
      </section>
      <section className="cv-section cv-alt" id="education">
        <SectionTitle eyebrow="04 / EDUCATION" title="المؤهلات العلمية" />
        <div className="cv-education-grid">{cv.education.map((study) => <article className="cv-study cv-reveal" key={study.degreeEn}><GraduationCap size={26} aria-hidden="true" /><div><h3>{study.degreeAr}</h3><p>{study.schoolAr}</p><span>{study.detailAr}</span></div></article>)}</div>
        <p className="cv-extra cv-reveal">{cv.certificateAr}</p>
        <div className="cv-languages cv-reveal"><strong>اللغات</strong>{cv.languages.map((l) => <span key={l}>{l}</span>)}</div>
      </section>
      <section className="cv-contact cv-reveal" id="contact"><span className="cv-eyebrow">LET'S CONNECT</span><h2>هل لديك فرصة عمل أو مشروع؟</h2><p>يسعدني مناقشة المشاريع المتعلقة بالبيانات الجغرافية وتطوير الأنظمة والحلول الرقمية.</p><div className="cv-contact-links"><a href={"mailto:" + cv.email}><Mail size={18}/> مراسلتي عبر البريد</a><a href={cv.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpLeft size={16}/></a><a href={cv.github} target="_blank" rel="noopener noreferrer"><Github size={18}/> GitHub</a></div></section>
    </main>
    <footer className="cv-footer"><span>© 2026 · {cv.nameAr}</span><a href={base}>العودة إلى الموقع <ArrowLeft size={15} /></a></footer>
  </div>;
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<React.StrictMode><App/></React.StrictMode>);
