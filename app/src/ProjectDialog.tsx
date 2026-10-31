import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ExternalLink,
  MessageCircle,
  Minus,
  Plus,
  X,
} from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { assetUrl, useSite, type Project } from "./content/SiteContent";

export default function ProjectDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const {
    content: { projects, projectDetails: copy },
    whatsapp,
  } = useSite();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      projects.findIndex((item) => item.id === project.id),
    ),
  );
  const [zoomed, setZoomed] = useState(false);
  const [closing, setClosing] = useState(false);
  const current = projects[index] ?? project;
  useEffect(() => {
    const element = dialog.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!closing) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 180;
    const timer = window.setTimeout(onClose, delay);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);
  const close = () => setClosing(true);
  const navigate = (offset: number) => {
    setIndex((value) => (value + offset + projects.length) % projects.length);
    setZoomed(false);
    dialog.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <dialog
      ref={dialog}
      className={`project-dialog studio-dialog ${closing ? "is-closing" : ""}`}
      aria-labelledby="project-title"
      aria-describedby="project-summary"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }
      }}
    >
      <div className="dialog-toolbar">
        <span>{copy.label}</span>
        <span
          className="dialog-counter"
          aria-label={`المشروع ${index + 1} من ${projects.length}`}
        >
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </span>
        <button
          className="icon-button dialog-close"
          onClick={close}
          aria-label="إغلاق تفاصيل المشروع"
          autoFocus
        >
          <X size={19} />
        </button>
      </div>
      <div className="dialog-content" key={current.title}>
        <div className="dialog-heading">
          <span className="eyebrow" dir="ltr">
            {current.type}
          </span>
          <h2 id="project-title" aria-live="polite" aria-atomic="true">
            {current.title}
          </h2>
          <span className="detail-status">
            <span />
            {current.status}
          </span>
        </div>
        <div className={`dialog-image ${zoomed ? "is-zoomed" : ""}`}>
          <ProgressiveImage
            key={current.image}
            src={assetUrl(current.image)}
            alt={`واجهة ${current.title}`}
            eager
          />
          <button
            className="image-zoom"
            aria-label={zoomed ? "تصغير صورة المشروع" : "تكبير صورة المشروع"}
            aria-pressed={zoomed}
            onClick={() => setZoomed(!zoomed)}
          >
            {zoomed ? <Minus size={16} /> : <Plus size={16} />}
            {zoomed ? "تصغير الصورة" : "تفاصيل الصورة"}
          </button>
        </div>
        <div className="dialog-body">
          <div className="project-story">
            <div>
              <span className="detail-label">{copy.idea}</span>
              <p id="project-summary">{current.desc}</p>
            </div>
            <div className="project-outcome">
              <span className="detail-label">{copy.value}</span>
              <p>{current.value}</p>
            </div>
          </div>
          {current.role && (
            <div className="project-contribution">
              <span className="detail-label">{copy.contribution}</span>
              <p>{current.role}</p>
            </div>
          )}
          <div className="project-tech">
            <span className="detail-label">{copy.technologies}</span>
            <div className="tags">
              {current.tech.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>
          <div className="dialog-cta">
            <div>
              <h3>{copy.ctaTitle}</h3>
              <p>{copy.ctaText}</p>
            </div>
            <div className="actions">
              {current.link && (
                <a
                  className="button secondary"
                  href={current.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.preview} <ExternalLink size={16} />
                </a>
              )}
              <a
                className="button primary"
                href={whatsapp(
                  `مرحبًا مهند، شاهدت مشروع «${current.title}» وأرغب بمناقشة فكرة مشابهة.\n\nفكرتي باختصار:`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                {copy.contact} <MessageCircle size={17} />
              </a>
            </div>
            {!current.link && (
              <small>
                {current.status.includes("خاص")
                  ? copy.privateNote
                  : copy.unavailableNote}
              </small>
            )}
          </div>
        </div>
      </div>
      <div className="dialog-navigation">
        <button onClick={() => navigate(-1)} aria-label="عرض المشروع السابق">
          <ArrowRight size={17} /> السابق
        </button>
        <span>
          {copy.more} <ArrowUpLeft size={14} />
        </span>
        <button onClick={() => navigate(1)} aria-label="عرض المشروع التالي">
          التالي <ArrowLeft size={17} />
        </button>
      </div>
    </dialog>
  );
}
