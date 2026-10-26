import { useState } from "react";
import { ArrowUpLeft, Plus } from "lucide-react";
import ProgressiveImage from "./ProgressiveImage";
import { useHoverPill } from "./HoverPill";
import { CardGlow } from "./CardGlow";
import { assetUrl, useSite, type Project } from "./content/SiteContent";

const filters = ["الكل", "GIS والخرائط", "أنظمة الويب", "مواقع ومنصات"];
function matches(project: Project, filter: string) {
  if (filter === "الكل") return true;
  if (filter === "GIS والخرائط") return project.category === "GIS والخرائط";
  if (filter === "أنظمة الويب") return project.category === "أنظمة الويب";
  return project.category === "مواقع ومنصات";
}

export default function ProjectsSection({
  onSelect,
}: {
  onSelect: (project: Project) => void;
}) {
  const {
    content: { projects, projectsHeading: copy },
    draft,
  } = useSite();
  const [filter, setFilter] = useState("الكل");
  const filterPill = useHoverPill<HTMLDivElement>("button.active", filter);
  const visible = projects.filter((project) => matches(project, filter));
  return (
    <section
      id="projects"
      className="container section studio-projects"
      aria-labelledby="projects-heading"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">{copy.label}</span>
          <h2 id="projects-heading">
            {copy.title}
            <br />
            <span>{copy.accent}</span>
          </h2>
        </div>
        <p>{copy.description}</p>
      </div>
      <div className="project-controls">
        <div
          className="filters"
          role="group"
          aria-label="تصفية المشاريع"
          ref={filterPill.ref}
          {...filterPill.handlers}
        >
          {filterPill.pill}
          {filters.map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
              <span className="filter-count" aria-hidden="true">
                {projects.filter((project) => matches(project, item)).length}
              </span>
            </button>
          ))}
        </div>
        <p
          className="results-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          عرض {visible.length} من {projects.length} مشاريع
        </p>
      </div>
      <div className="projects-grid" key={filter}>
        {visible.map((project, index) => (
          <article
            className={`project-card ${filter === "الكل" && index === 0 ? "featured" : ""}`}
            key={project.id}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <CardGlow src={assetUrl(project.image)} />
            <button
              className="project-preview"
              onClick={() => onSelect(project)}
              aria-label={`عرض تفاصيل ${project.title}`}
              aria-haspopup="dialog"
            >
              <ProgressiveImage
                src={assetUrl(project.image)}
                alt={`واجهة ${project.title}`}
              />
              <span className="preview-action">
                <ArrowUpLeft size={22} />
              </span>
              <span className="project-status">
                <span />
                {project.status}
              </span>
            </button>
            <div className="project-info">
              <span className="eyebrow" dir="ltr">
                {project.type}
              </span>
              <h3>
                <button
                  onClick={() => onSelect(project)}
                  aria-haspopup="dialog"
                >
                  {project.title}
                </button>
              </h3>
              <p>{project.desc}</p>
              <div className="tags">
                {project.tech.slice(0, 3).map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
              <div className="project-card-footer">
                <button
                  onClick={() => onSelect(project)}
                  aria-haspopup="dialog"
                  aria-label={`اكتشف تفاصيل ${project.title}`}
                >
                  {copy.detailsLabel}{" "}
                  <span>
                    <Plus size={18} />
                  </span>
                </button>
                <small>
                  {project.link
                    ? "معاينة متاحة"
                    : project.status.includes("خاص")
                      ? "مشروع خاص"
                      : "عرض الفكرة والواجهة"}
                </small>
              </div>
              {draft && (
                <button
                  className="cms-edit-card"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("cms-edit-project", {
                        detail: project.id,
                      }),
                    )
                  }
                >
                  تحرير هذه البطاقة
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="projects-note">{copy.note}</p>
    </section>
  );
}
