import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import defaults from "./default.json";

export const CMS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_CMS === "true";
export type SiteContent = typeof defaults;
export type Project = SiteContent["projects"][number];
/**
 * Backward compatibility for content saved in Docker before project contribution
 * fields existed. Do not replace an editor's own wording when already present.
 */
export function normalizeSiteContent(input: SiteContent): SiteContent {
  return {
    ...input,
    projectDetails: {
      ...defaults.projectDetails,
      ...input.projectDetails,
    },
    projects: input.projects.map((project) => ({
      ...project,
      role:
        typeof project.role === "string"
          ? project.role
          : (defaults.projects.find((item) => item.id === project.id)?.role ?? ""),
    })),
  };
}

export const assetUrl = (path: string) =>
  /^(https?:|data:|blob:)/i.test(path)
    ? path
    : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
export const api = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${import.meta.env.BASE_URL}api/${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "لوحة التحرير تحتاج تشغيل خادم Docker؛ هذه النسخة للعرض فقط.",
    );
  }
  if (!response.ok) throw new Error(body.error || "تعذّر إكمال الطلب.");
  return body;
};
type SiteState = {
  content: SiteContent;
  saved: SiteContent;
  revision: number;
  draft: SiteContent | null;
  setDraft: (value: SiteContent | null) => void;
  accept: (value: { content: SiteContent; revision: number }) => void;
  loaded: boolean;
  connected: boolean;
};
const SiteContext = createContext<SiteState | null>(null);
export function SiteProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SiteContent>(defaults);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const accept = (value: { content: SiteContent; revision: number }) => {
    setSaved(normalizeSiteContent(value.content));
    setRevision(value.revision);
    setConnected(true);
  };
  useEffect(() => {
    if (!CMS_ENABLED) {
      setLoaded(true);
      return;
    }
    let active = true;
    api("content")
      .then((value) => {
        if (active) accept(value);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <SiteContext.Provider
      value={{
        content: draft ?? saved,
        saved,
        revision,
        draft,
        setDraft,
        accept,
        loaded,
        connected,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}
export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("SiteProvider missing");
  const whatsapp = (message: string) =>
    `https://wa.me/${value.content.identity.whatsapp}?text=${encodeURIComponent(message)}`;
  return {
    ...value,
    whatsapp,
    generalWhatsApp: whatsapp(value.content.identity.whatsappMessage),
  };
}
