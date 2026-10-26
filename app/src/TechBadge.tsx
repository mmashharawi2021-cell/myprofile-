import type { CSSProperties } from "react";
import {
  siArcgis,
  siDocker,
  siFirebase,
  siJavascript,
  siJson,
  siLeaflet,
  siMaplibre,
  siNodedotjs,
  siOpenstreetmap,
  siPostgresql,
  siPython,
  siQgis,
  siReact,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

// Official logos and brand colours for the technologies strip. GeoJSON has no
// official mark, so it borrows the JSON icon in green. Unknown names stay plain.
export const brands: Record<string, { icon: SimpleIcon; color?: string }> = {
  react: { icon: siReact },
  typescript: { icon: siTypescript },
  javascript: { icon: siJavascript },
  "arcgis pro": { icon: siArcgis },
  arcgis: { icon: siArcgis },
  firebase: { icon: siFirebase },
  maplibre: { icon: siMaplibre },
  geojson: { icon: siJson, color: "#4caf50" },
  json: { icon: siJson, color: "#4caf50" },
  leaflet: { icon: siLeaflet },
  openstreetmap: { icon: siOpenstreetmap },
  qgis: { icon: siQgis },
  python: { icon: siPython },
  postgresql: { icon: siPostgresql },
  "node.js": { icon: siNodedotjs },
  docker: { icon: siDocker },
};

export function TechBadge({ name }: { name: string }) {
  const brand = brands[name.trim().toLowerCase()];
  if (!brand) return <b>{name}</b>;
  const color = brand.color ?? `#${brand.icon.hex}`;
  return (
    <b className="tech-badge" style={{ "--brand": color } as CSSProperties}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={brand.icon.path} />
      </svg>
      {name}
    </b>
  );
}
