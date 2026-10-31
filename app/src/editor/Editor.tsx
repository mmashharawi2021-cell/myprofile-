import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  History,
  LogOut,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  api,
  assetUrl,
  useSite,
  type SiteContent,
} from "../content/SiteContent";
import defaults from "../content/default.json";
import { validateContent } from "../../../shared/validate-content.mjs";
import "./editor.css";

type Value = string | number | boolean | Value[] | { [key: string]: Value };
const labels: Record<string, string> = {
  identity: "الهوية والتواصل",
  name: "الاسم",
  subtitle: "المسمى المختصر",
  portrait: "الصورة الشخصية",
  email: "البريد الإلكتروني",
  whatsapp: "رقم واتساب مع رمز الدولة",
  github: "رابط GitHub",
  whatsappMessage: "رسالة واتساب الافتراضية",
  theme: "المظهر",
  defaultMode: "الوضع الافتراضي",
  accent: "لون التمييز / النص الملوّن",
  radius: "استدارة البطاقات (0–50)",
  fontSize: "حجم النص الأساسي (12–24)",
  font: "الخط",
  navigation: "القائمة والروابط",
  href: "وجهة الرابط",
  label: "العنوان الصغير",
  sections: "ترتيب الأقسام وإظهارها",
  visible: "إظهار القسم",
  hero: "الواجهة الأولى",
  badge: "النص العلوي",
  greeting: "الترحيب",
  title: "العنوان",
  description: "الوصف",
  primaryLabel: "نص الزر الرئيسي",
  primaryLink: "وجهة الزر الرئيسي",
  secondaryLabel: "نص زر التواصل",
  specialties: "التخصصات",
  windowLabel: "عنوان إطار المشروع",
  openLabel: "نص فتح المشروع",
  mapTitle: "عنوان البطاقة العائمة",
  mapText: "وصف البطاقة العائمة",
  role: "التخصص أسفل الاسم",
  caption: "النص أسفل الصورة",
  scrollLabel: "نص اكتشف المزيد",
  expertise: "شريط التقنيات",
  items: "التقنيات",
  projectsHeading: "عناوين قسم المشاريع",
  note: "الملاحظة",
  detailsLabel: "نص زر التفاصيل",
  projects: "بطاقات المشاريع",
  type: "نوع المشروع المعروض",
  category: "تصنيف التصفية",
  status: "حالة المشروع",
  image: "صورة المشروع",
  desc: "وصف المشروع",
  value: "القيمة / النتيجة",
  contribution: "عنوان قسم المساهمة المهنية",
  tech: "التقنيات والمجالات",
  link: "رابط المعاينة (اختياري)",
  projectDetails: "نصوص نافذة التفاصيل",
  idea: "عنوان الفكرة",
  technologies: "عنوان التقنيات",
  ctaTitle: "عنوان التواصل",
  ctaText: "وصف التواصل",
  preview: "نص رابط المعاينة",
  contact: "نص زر التواصل",
  privateNote: "ملاحظة المشروع الخاص",
  unavailableNote: "ملاحظة غياب المعاينة",
  more: "نص التنقل بين المشاريع",
  servicesHeading: "عناوين قسم الخدمات",
  services: "بطاقات الخدمات",
  icon: "الأيقونة",
  about: "التعريف والمهارات",
  linkLabel: "نص رابط GitHub",
  skills: "بطاقات المهارات",
  process: "مراحل العمل",
  steps: "الخطوات",
  formTitle: "عنوان النموذج",
  nameLabel: "عنوان حقل الاسم",
  namePlaceholder: "مثال الاسم",
  typeLabel: "عنوان نوع المشروع",
  types: "خيارات نوع المشروع",
  messageLabel: "عنوان الرسالة",
  messagePlaceholder: "مثال الرسالة",
  submitLabel: "نص زر الإرسال",
  whatsappLabel: "نص رابط واتساب",
  githubLabel: "نص رابط GitHub",
  emailLabel: "نص رابط البريد",
  footer: "أسفل الموقع",
  copyright: "نص الحقوق",
  contactLabel: "نص زر لنتحدث",
  seo: "عنوان الموقع ومحركات البحث",
};
const groups: [string, string[]][] = [
  ["الهوية", ["identity"]],
  ["الأقسام والقائمة", ["sections", "navigation"]],
  ["الواجهة الأولى", ["hero", "expertise"]],
  ["المشاريع", ["projects", "projectsHeading", "projectDetails"]],
  ["الخدمات", ["servicesHeading", "services"]],
  ["المهارات", ["about", "skills"]],
  ["مراحل العمل", ["process"]],
  ["التواصل", ["contact"]],
  ["المظهر", ["theme"]],
  ["العنوان والتذييل", ["seo", "footer"]],
];
const sectionNames: Record<string, string> = {
  home: "الواجهة الأولى",
  expertise: "شريط التقنيات",
  projects: "المشاريع",
  services: "الخدمات",
  skills: "المهارات",
  process: "مراحل العمل",
  contact: "التواصل",
};
const choices: Record<string, string[]> = {
  category: ["GIS والخرائط", "أنظمة الويب", "مواقع ومنصات"],
  icon: ["code", "layers", "map", "arrow", "database", "check"],
  font: ["Tajawal", "Inter", "system-ui"],
  defaultMode: ["light", "dark"],
};
const isRecord = (value: Value): value is { [key: string]: Value } =>
  !!value && typeof value === "object" && !Array.isArray(value);
function Fields({
  value,
  template,
  onChange,
  path,
}: {
  value: Value;
  template: Value;
  onChange: (value: Value) => void;
  path: string;
}) {
  const [armed, setArmed] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const key = path.split(".").slice(-1)[0] ?? path;
  if (Array.isArray(value)) {
    const sample = (template as Value[])[0];
    const move = (index: number, offset: number) => {
      const next = [...value];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      onChange(next);
    };
    return (
      <div className="cms-list">
        {value.map((entry, index) => (
          <details
            className="cms-item"
            data-cms-id={isRecord(entry) ? String(entry.id ?? "") : undefined}
            key={
              isRecord(entry) && typeof entry.id === "string"
                ? entry.id
                : `${path}-${index}`
            }
            open={!isRecord(entry)}
          >
            <summary>
              {isRecord(entry)
                ? String(
                    entry.title ||
                      sectionNames[String(entry.id)] ||
                      entry.label ||
                      `بطاقة ${index + 1}`,
                  )
                : `عنصر ${index + 1}`}
            </summary>
            <div className="cms-item-actions">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label="نقل لأعلى"
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
                aria-label="نقل لأسفل"
              >
                <ArrowDown size={15} />
              </button>
              {key !== "sections" && (
                <button
                  type="button"
                  className="cms-delete"
                  disabled={key === "projects" && value.length === 1}
                  onClick={() => {
                    if (armed === index) {
                      onChange(value.filter((_, i) => i !== index));
                      setArmed(null);
                    } else setArmed(index);
                  }}
                >
                  <Trash2 size={14} />
                  {armed === index ? "اضغط لتأكيد الحذف" : "حذف"}
                </button>
              )}
            </div>
            <Fields
              value={entry}
              template={sample}
              path={`${path}.${index}`}
              onChange={(next) =>
                onChange(value.map((item, i) => (i === index ? next : item)))
              }
            />
          </details>
        ))}
        {key !== "sections" && (
          <button
            type="button"
            className="cms-add"
            onClick={() => {
              const item = structuredClone(sample);
              if (isRecord(item)) {
                if ("id" in item) item.id = crypto.randomUUID();
                if ("title" in item) item.title = "بطاقة جديدة";
                if ("label" in item) item.label = "رابط جديد";
              }
              onChange([...value, item]);
            }}
          >
            <Plus size={16} />
            إضافة {key === "projects" ? "مشروع" : "عنصر"}
          </button>
        )}
      </div>
    );
  }
  if (isRecord(value))
    return (
      <div className="cms-fields">
        {Object.entries(value)
          .filter(([name]) => name !== "id")
          .map(([name, entry]) => (
            <div className="cms-field" key={name}>
              <label htmlFor={`cms-${path}-${name}`}>
                {name === "accent" && path !== "theme"
                  ? "السطر الملوّن"
                  : name === "role" && path.startsWith("projects.")
                    ? "دوري ومساهمتي في المشروع"
                    : (labels[name] ?? name)}
              </label>
              <Fields
                value={entry}
                template={(template as { [key: string]: Value })[name]}
                path={`${path}.${name}`}
                onChange={(next) => onChange({ ...value, [name]: next })}
              />
            </div>
          ))}
      </div>
    );
  const id = `cms-${path.replace(/\.[^.]+$/, "")}-${key}`;
  if (typeof value === "boolean")
    return (
      <label className="cms-switch">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
        />
        {value ? "ظاهر للزوار" : "مخفي عن الزوار"}
      </label>
    );
  if (typeof value === "number")
    return (
      <input
        id={id}
        type="number"
        min={key === "radius" ? 0 : 12}
        max={key === "radius" ? 50 : 24}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  if (choices[key])
    return (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {choices[key].map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  const image = key === "image" || key === "portrait";
  return (
    <>
      {image && value && (
        <img
          className="cms-image-preview"
          src={assetUrl(value)}
          alt="الصورة الحالية"
        />
      )}
      {value.length > 100 ||
      [
        "description",
        "desc",
        "value",
        "role",
        "message",
        "title",
        "whatsappMessage",
      ].includes(key) ? (
        <textarea
          id={id}
          rows={key === "title" ? 2 : 3}
          value={value}
          maxLength={10000}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={path === "theme.accent" ? "color" : "text"}
          value={value}
          dir={
            [
              "image",
              "portrait",
              "link",
              "href",
              "github",
              "email",
              "whatsapp",
              "primaryLink",
            ].includes(key)
              ? "ltr"
              : "auto"
          }
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {image && (
        <>
          <label className="cms-upload">
            {uploading ? (
              "جارٍ رفع الصورة…"
            ) : (
              <>
                <Upload size={15} />
                رفع صورة من الجهاز
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 8 * 1024 * 1024) {
                  setUploadError("الحد الأقصى 8 ميغابايت.");
                  return;
                }
                setUploading(true);
                setUploadError("");
                try {
                  const data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () =>
                      resolve(String(reader.result).split(",")[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                  const uploaded = await api("media", {
                    method: "POST",
                    body: JSON.stringify({ data }),
                  });
                  onChange(uploaded.path);
                } catch (error) {
                  setUploadError(
                    error instanceof Error ? error.message : "فشل رفع الصورة.",
                  );
                } finally {
                  setUploading(false);
                  event.target.value = "";
                }
              }}
            />
          </label>
          <small>PNG، JPEG أو WebP، حتى 8 ميغابايت.</small>
          {uploadError && (
            <p className="cms-error" role="alert">
              {uploadError}
            </p>
          )}
        </>
      )}
    </>
  );
}
export default function Editor({ onClose }: { onClose: () => void }) {
  const { saved, draft, setDraft, revision, accept } = useSite();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [group, setGroup] = useState(0);
  const [preview, setPreview] = useState(false);
  const [targetProject, setTargetProject] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: number; created_at: string }[]>(
    [],
  );
  const [showHistory, setShowHistory] = useState(false);
  const [undo, setUndo] = useState<SiteContent[]>([]);
  const [redo, setRedo] = useState<SiteContent[]>([]);
  const [exitIntent, setExitIntent] = useState<"close" | "logout" | null>(null);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    if (!authenticated) return;
    const editCard = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (typeof id !== "string") return;
      setPreview(false);
      setShowHistory(false);
      setGroup(3);
      setTargetProject(id);
    };
    window.addEventListener("cms-edit-project", editCard);
    return () => window.removeEventListener("cms-edit-project", editCard);
  }, [authenticated]);
  useEffect(() => {
    if (!targetProject || preview) return;
    const item = document.querySelector<HTMLDetailsElement>(
      `[data-cms-id="${CSS.escape(targetProject)}"]`,
    );
    if (item) {
      item.open = true;
      item.scrollIntoView({ block: "start" });
      item
        .querySelector<HTMLInputElement>("textarea, input")
        ?.focus({ preventScroll: true });
      setTargetProject(null);
    }
  }, [targetProject, group, preview]);
  const begin = async () => {
    const latest = await api("content");
    accept(latest);
    setDraft(structuredClone(latest.content));
    setAuthenticated(true);
  };
  useEffect(() => {
    let active = true;
    api("session")
      .then(async (value) => {
        if (active && value.authenticated) await begin();
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const change = (next: SiteContent) => {
    if (draft)
      setUndo((items) => [...items.slice(-29), structuredClone(draft)]);
    setRedo([]);
    setDraft(next);
    setNotice("");
  };
  const finish = async (logout = false) => {
    try {
      if (logout) await api("logout", { method: "POST", body: "{}" });
      setDraft(null);
      onClose();
    } catch (error) {
      setError((error as Error).message);
    }
  };
  const exit = (intent: "close" | "logout") => {
    if (dirty) setExitIntent(intent);
    else void finish(intent === "logout");
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft ?? saved, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "myprofile-content.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (preview)
    return (
      <div className="cms-preview-bar">
        <span>معاينة {dirty ? "غير محفوظة" : "الموقع"}</span>
        <button onClick={() => setPreview(false)}>
          <PencilIcon />
          العودة للتحرير
        </button>
      </div>
    );
  return (
    <aside className="cms-panel" aria-label="لوحة تحرير الموقع" dir="rtl">
      <div className="cms-top">
        <div>
          <span>MYPROFILE STUDIO</span>
          <h2>تحرير الموقع</h2>
        </div>
        <button
          className="icon-button"
          onClick={() => exit("close")}
          aria-label="إغلاق لوحة التحرير"
        >
          <X size={19} />
        </button>
      </div>
      {checking ? (
        <p className="cms-message">جارٍ التحقق من الجلسة…</p>
      ) : !authenticated ? (
        <form
          className="cms-login"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("login", {
                method: "POST",
                body: JSON.stringify({ password }),
              });
              setPassword("");
              await begin();
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="cms-lock">⌁</span>
          <h3>الموقع بين يديك.</h3>
          <p>أدخل كلمة المرور لبدء التحرير.</p>
          <label htmlFor="editor-password">كلمة المرور</label>
          <input
            id="editor-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />
          <button className="button primary" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "فتح لوحة التحرير"}
          </button>
          {error && (
            <p className="cms-error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <>
          <div className="cms-status">
            <span className={dirty ? "cms-unsaved" : "cms-saved"}>
              {dirty ? "● تعديلات غير محفوظة" : "✓ المحتوى محفوظ"}
            </span>
            <button onClick={() => setPreview(true)}>
              <Eye size={16} />
              معاينة
            </button>
          </div>
          <div className="cms-tools">
            <button
              disabled={!undo.length || busy}
              onClick={() => {
                if (!draft) return;
                setRedo((items) => [...items, draft]);
                setDraft(undo[undo.length - 1]!);
                setUndo((items) => items.slice(0, -1));
              }}
              aria-label="تراجع"
            >
              <RotateCcw size={16} />
            </button>
            <button
              disabled={!redo.length || busy}
              onClick={() => {
                if (!draft) return;
                setUndo((items) => [...items, draft]);
                setDraft(redo[redo.length - 1]!);
                setRedo((items) => items.slice(0, -1));
              }}
              aria-label="إعادة"
            >
              <RotateCw size={16} />
            </button>
            <button disabled={busy} onClick={download}>
              تصدير المحتوى
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                setShowHistory(!showHistory);
                try {
                  const value = await api("history");
                  setHistory(value.versions);
                } catch (error) {
                  setError((error as Error).message);
                }
              }}
            >
              <History size={15} />
              السجل
            </button>
          </div>
          {error && (
            <p className="cms-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="cms-success" role="status">
              {notice}
            </p>
          )}
          {exitIntent && (
            <div className="cms-confirm" role="alert">
              <p>عندك تعديلات غير محفوظة. هل تريد إهمالها والخروج؟</p>
              <button onClick={() => setExitIntent(null)}>
                متابعة التحرير
              </button>
              <button onClick={() => void finish(exitIntent === "logout")}>
                إهمال والخروج
              </button>
            </div>
          )}
          {showHistory ? (
            <div className="cms-history">
              <h3>آخر 30 نسخة محفوظة</h3>
              <p>
                اختيار نسخة يحمّلها للمعاينة. لن تظهر للزوار حتى تضغط «حفظ».
              </p>
              {history.map((version) => (
                <div key={version.id}>
                  <span>
                    نسخة {version.id}
                    <small>
                      {new Date(version.created_at).toLocaleString("ar", {
                        timeZone: "Asia/Jerusalem",
                      })}
                    </small>
                  </span>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      try {
                        const value = await api(`history/${version.id}`);
                        change(value.content);
                        setShowHistory(false);
                        setNotice(
                          "تم تحميل النسخة للمعاينة. اضغط حفظ لاعتمادها.",
                        );
                      } catch (error) {
                        setError((error as Error).message);
                      }
                    }}
                  >
                    معاينة
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <nav className="cms-tabs" aria-label="أقسام التحرير">
                {groups.map(([name], index) => (
                  <button
                    className={group === index ? "active" : ""}
                    key={name}
                    onClick={() => setGroup(index)}
                  >
                    {name}
                  </button>
                ))}
              </nav>
              <fieldset className="cms-body" disabled={busy}>
                {draft &&
                  groups[group][1].map((key) => (
                    <section className="cms-group" key={key}>
                      <h3>{labels[key] ?? key}</h3>
                      <Fields
                        value={draft[key as keyof SiteContent] as Value}
                        template={defaults[key as keyof SiteContent] as Value}
                        path={key}
                        onChange={(value) => change({ ...draft, [key]: value })}
                      />
                    </section>
                  ))}
              </fieldset>
            </>
          )}
          <div className="cms-bottom">
            <button
              className="button primary"
              disabled={busy || !dirty}
              onClick={async () => {
                if (!draft) return;
                setBusy(true);
                setError("");
                try {
                  validateContent(draft, defaults);
                  const value = await api("content", {
                    method: "PUT",
                    body: JSON.stringify({ content: draft, revision }),
                  });
                  accept(value);
                  setDraft(structuredClone(value.content));
                  setUndo([]);
                  setRedo([]);
                  setNotice("تم الحفظ. المحتوى الجديد متاح لكل الزوار.");
                } catch (error) {
                  setError((error as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Save size={16} />
              {busy ? "جارٍ الحفظ…" : "حفظ التعديلات"}
            </button>
            <button
              className="cms-logout"
              disabled={busy}
              onClick={() => exit("logout")}
            >
              <LogOut size={16} />
              خروج
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
function PencilIcon() {
  return <Check size={15} />;
}
