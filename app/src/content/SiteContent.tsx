import { createContext, useContext, type ReactNode } from "react";
import defaults from "./default.json";

export type SiteContent = typeof defaults;
export type Project = SiteContent["projects"][number];

export const assetUrl = (path: string) =>
  /^(https?:|data:|blob:)/i.test(path)
    ? path
    : `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
type SiteState = { content: SiteContent };
const SiteContext = createContext<SiteState | null>(null);
export function SiteProvider({ children }: { children: ReactNode }) {
  return (
    <SiteContext.Provider value={{ content: defaults }}>
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
