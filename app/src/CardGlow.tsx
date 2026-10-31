import { useEffect, useRef, useState, type CSSProperties } from "react";

const cache = new Map<string, Promise<string | null>>();

// Picks the most vivid colour of an image: pixels are averaged with weight on
// saturation, so a blue dashboard on a white page reads as blue, not grey.
function sample(src: string) {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          const weight = ((max - min) / 255) ** 2 + 0.002;
          r += data[i] * weight;
          g += data[i + 1] * weight;
          b += data[i + 2] * weight;
          total += weight;
        }
        resolve(vivid(r / total, g / total, b / total));
      } catch {
        resolve(null);
      }
    };
    image.src = src;
  });
}

// Lifts the averaged colour to a bright, saturated tone that glows on both themes.
function vivid(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
  }
  h = Math.round(((h * 60) + 360) % 360);
  const saturation = d < 0.06 ? 20 : 85;
  return `hsl(${h} ${saturation}% 58%)`;
}

// A light that travels around the card's border in the image's own colour.
export function CardGlow({ src }: { src: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    const node = element.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNearby(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // Avoid eager image decoding and canvas sampling for off-screen cards.
  const color = useImageAccent(nearby ? src : null);
  return (
    <span
      ref={element}
      className={`card-glow${color ? " is-ready" : ""}`}
      style={color ? ({ "--glow": color } as CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}

export function useImageAccent(src: string | null) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!src) return;
    let active = true;
    if (!cache.has(src)) cache.set(src, sample(src));
    cache.get(src)!.then((value) => {
      if (active) setColor(value);
    });
    return () => {
      active = false;
    };
  }, [src]);
  return color;
}
