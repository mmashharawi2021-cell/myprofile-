import { useEffect, useRef, type CSSProperties } from "react";
import { brands } from "./TechBadge";

// Decorative tech and GIS terms drifting behind the hero. Each entry is
// [label, brand key or null, left %, top %, size px, seconds per loop].
const words: [string, string | null, number, number, number, number][] = [
  ["React", "react", 4, 8, 17, 11],
  ["TypeScript", "typescript", 80, 5, 16, 13],
  ["ArcGIS", "arcgis", 2, 38, 15, 12],
  ["{ GeoJSON }", "geojson", 84, 30, 15, 14],
  ["Firebase", "firebase", 12, 66, 14, 10],
  ["MapLibre", "maplibre", 78, 58, 16, 12],
  ["Python", "python", 22, 22, 13, 15],
  ["QGIS", "qgis", 68, 18, 13, 11],
  ["Leaflet", "leaflet", 90, 76, 13, 13],
  ["PostgreSQL", "postgresql", 0, 84, 13, 14],
  ["Docker", "docker", 64, 78, 12, 12],
  ["OpenStreetMap", "openstreetmap", 25, 88, 12, 16],
  ["EPSG:4326", null, 34, 4, 12, 13],
  ["</>", null, 92, 46, 18, 9],
  ["lat, lng", null, 7, 52, 12, 12],
  ["SELECT * FROM layers", null, 56, 92, 11, 15],
  ["WGS 84", null, 72, 40, 11, 11],
  ["npm run build", null, 15, 76, 11, 14],
];

const REACH = 150;
const PUSH = 70;

export function FloatingWords() {
  const ref = useRef<HTMLDivElement>(null);

  // Words slide away from a nearby pointer and drift back once it leaves.
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches)
      return;
    const items = Array.from(ref.current?.children ?? []) as HTMLElement[];
    const pushes = items.map(() => ({ x: 0, y: 0 }));
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const update = () => {
      frame = 0;
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const push = pushes[index];
        const dx = rect.left + rect.width / 2 - push.x - (pointer?.x ?? -1e4);
        const dy = rect.top + rect.height / 2 - push.y - (pointer?.y ?? -1e4);
        const distance = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - distance / REACH) * PUSH;
        push.x = (dx / distance) * force;
        push.y = (dy / distance) * force;
        item.style.transform = `translate(${push.x}px, ${push.y}px)`;
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const leave = () => {
      pointer = null;
      schedule();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="floating-words" aria-hidden="true" ref={ref}>
      {words.map(([label, key, left, top, size, seconds], index) => {
        const brand = key ? brands[key] : undefined;
        const color = brand ? (brand.color ?? `#${brand.icon.hex}`) : undefined;
        return (
          <span
            key={label}
            className={brand ? "is-brand" : undefined}
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                fontSize: size,
                "--brand": color,
              } as CSSProperties
            }
          >
            <span
              style={{
                animationDuration: `${seconds}s`,
                animationDelay: `${-index * 1.7}s`,
              }}
            >
              {brand && (
                <svg viewBox="0 0 24 24">
                  <path d={brand.icon.path} />
                </svg>
              )}
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
