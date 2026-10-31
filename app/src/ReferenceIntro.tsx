import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = { onComplete: () => void };

/**
 * Recreates the submitted 3.39-second reference scene with DOM/SVG/CSS animations.
 * The video is NOT embedded or requested by the browser.
 */
const ASSET = `${import.meta.env.BASE_URL}assets/brand/video-reference-mark.svg`;
const DURATION = 3390;
const slices = [
  [0, 13, -36, -6, 80], [9, 21, 24, -13, 180], [19, 31, -32, 9, 380],
  [29, 42, 33, -6, 140], [40, 52, -25, 10, 300], [50, 62, 24, -8, 90],
  [60, 72, -37, 11, 410], [70, 83, 26, -3, 270], [81, 94, -18, 7, 350],
  [90, 100, 30, -4, 240], [12, 30, 19, 2, 490], [47, 68, -22, -5, 510],
] as const;
const signals = [
  [13, 19, 69, 1, "s-cyan", 170], [20, 26, 23, 3, "s-white", 230],
  [28, 22, 40, 2, "s-red", 240], [31, 41, 15, 3, "s-cyan", 205],
  [44, 29, 8, 4, "s-green", 285], [51, 34, 55, 2, "s-cyan", 360],
  [62, 40, 14, 2, "s-white", 400], [67, 46, 18, 3, "s-blue", 255],
  [74, 37, 31, 2, "s-green", 330], [82, 51, 8, 4, "s-red", 300],
  [22, 55, 30, 2, "s-white", 275], [35, 66, 17, 2, "s-blue", 370],
  [50, 61, 36, 2, "s-cyan", 420], [70, 60, 17, 2, "s-yellow", 310],
  [86, 48, 14, 3, "s-cyan", 240], [17, 73, 18, 2, "s-white", 420],
] as const;

export default function ReferenceIntro({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const done = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const close = () => {
      if (done.current) return;
      done.current = true;
      onCompleteRef.current();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", keydown);
    const frame = window.requestAnimationFrame(() => setActive(true));
    const completion = window.setTimeout(close, DURATION);
    const failSafe = window.setTimeout(close, DURATION + 600);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(completion);
      window.clearTimeout(failSafe);
      document.removeEventListener("keydown", keydown);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className={`brand-intro-overlay reference-intro${active ? " is-running" : ""}`}
      role="dialog" aria-modal="true" aria-label="مقدمة الشعار الجغرافي">
      <div className="reference-intro-scene" aria-hidden="true">
        <div className="reference-intro-noise" />
        <div className="reference-intro-signals">
          {signals.map(([left, top, width, height, tone, delay], index) => (
            <span key={index} className={`reference-intro-signal ${tone}`} style={{
              left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}px`,
              animationDelay: `${delay}ms`,
            }} />
          ))}
        </div>
        <div className="reference-intro-symbol">
          <img className="reference-intro-ghost" src={ASSET} alt="" draggable={false} />
          {slices.map(([top, bottom, dx, dy, delay], index) => (
            <img key={index} className="reference-intro-slice" src={ASSET} alt=""
              draggable={false} style={{
                clipPath: `inset(${top}% 0 ${100 - bottom}% 0)`,
                "--gx": `${dx}px`, "--gy": `${dy}px`,
                animationDelay: `${delay}ms`,
              } as CSSProperties} />
          ))}
          <img className="reference-intro-logo" src={ASSET} alt="" draggable={false} />
          <span className="reference-intro-flash" />
          <span className="reference-intro-decay" />
        </div>
      </div>
      <span className="reference-intro-sr" role="status">جارٍ فتح الموقع</span>
    </div>
  );
}
