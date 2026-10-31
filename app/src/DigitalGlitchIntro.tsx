import { useEffect, useRef, useState, type RefObject } from "react";
import { approvedLogoSrc, brandMarkPath } from "./brandAsset";

type DigitalGlitchIntroProps = {
  targetRef: RefObject<HTMLSpanElement>;
  onComplete: () => void;
};

const FRAGMENTS = Array.from({ length: 10 }, (_, index) => index);
const SIGNALS = Array.from({ length: 16 }, (_, index) => index);

/**
 * Short, CSS-driven digital assembly based on the approved reference video.
 * The actual V4 artwork is used for every fragment, final image and header hand-off.
 * No video download, looping effects, or fake loading progress is necessary.
 */
export default function DigitalGlitchIntro({ targetRef, onComplete }: DigitalGlitchIntroProps) {
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const sourceRef = useRef<HTMLImageElement>(null);
  const flightRef = useRef<HTMLImageElement | null>(null);
  const completed = useRef(false);

  // Keep completion idempotent across a skip, animation callbacks and effect cleanup.
  const complete = () => {
    if (completed.current) return;
    completed.current = true;
    flightRef.current?.remove();
    flightRef.current = null;
    onComplete();
  };

  useEffect(() => {
    const oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(() => {
        if (!completed.current) fn();
      }, ms));
    };
    const frame = window.requestAnimationFrame(() => setStarted(true));

    later(() => {
      const source = sourceRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      const canFly = !!source && !!target && target.width > 6 && target.height > 6
        && typeof document.createElement("div").animate === "function";
      if (!canFly || !source || !target) {
        complete();
        return;
      }

      const flight = document.createElement("img");
      flight.src = approvedLogoSrc;
      flight.alt = "";
      flight.setAttribute("aria-hidden", "true");
      flight.className = "brand-intro-flight digital-intro-flight";
      Object.assign(flight.style, {
        left: source.left + "px",
        top: source.top + "px",
        width: source.width + "px",
        height: source.height + "px",
      });
      document.body.appendChild(flight);
      flightRef.current = flight;
      sourceRef.current?.closest(".brand-intro-symbol")?.classList.add("is-flying");

      const targetWidth = Math.min(target.width - 4, 60);
      const targetHeight = Math.min(target.height - 4, 46);
      const motion = flight.animate([
        { left: source.left + "px", top: source.top + "px", width: source.width + "px", height: source.height + "px" },
        {
          left: (target.left + (target.width - targetWidth) / 2) + "px",
          top: (target.top + (target.height - targetHeight) / 2) + "px",
          width: targetWidth + "px",
          height: targetHeight + "px",
        },
      ], { duration: 650, easing: "cubic-bezier(.23,.78,.21,1)", fill: "forwards" });
      later(() => setLeaving(true), 90);
      void motion.finished.then(complete).catch(complete);
    }, 2680);

    // Fail-safe: never leave visitors trapped behind the intro.
    later(complete, 4300);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      flightRef.current?.remove();
      flightRef.current = null;
      document.documentElement.style.overflow = oldOverflow;
    };
  }, [targetRef, onComplete]);

  return (
    <div
      className={"brand-intro-overlay digital-intro" + (started ? " is-running" : "") + (leaving ? " is-leaving" : "")}
      role="dialog"
      aria-modal="true"
      aria-label="مقدمة الشعار الرقمية"
    >
      <div className="digital-intro-haze" aria-hidden="true" />
      <div className="digital-intro-scene">
        <div className="digital-intro-signals" aria-hidden="true">
          {SIGNALS.map((id) => <span className={"digital-intro-signal signal-" + id} key={id} />)}
        </div>
        <div className="brand-intro-symbol digital-intro-symbol">
          <div className="digital-intro-mark">
            <img ref={sourceRef} className="digital-intro-base" src={approvedLogoSrc} alt="" draggable={false} />
            {FRAGMENTS.map((id) => (
              <img
                className={"digital-intro-fragment fragment-" + id}
                src={approvedLogoSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
                key={id}
              />
            ))}
            <svg className="digital-intro-wiring" viewBox="0 0 785 575" aria-hidden="true">
              <defs>
                <clipPath id="digitalMarkClip"><path d={brandMarkPath} /></clipPath>
                <linearGradient id="digitalEdge" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#1268d1" />
                  <stop offset=".5" stopColor="#a2efff" />
                  <stop offset="1" stopColor="#0bbefe" />
                </linearGradient>
              </defs>
              <g clipPath="url(#digitalMarkClip)" className="digital-intro-circuits">
                <path d="M -10 178 H 178 L 264 265 H 436 L 539 161 H 810 M -20 368 H 130 L 208 431 H 334 L 402 358 H 612 L 788 468 M 48 544 V 397 L 138 335 H 314 M 735 31 V 181 L 629 292 H 489 M 170 12 L 315 175 H 470 L 606 45 M 590 578 V 415 L 511 353" />
                <circle cx="178" cy="178" r="5" />
                <circle cx="436" cy="265" r="6" />
                <circle cx="208" cy="431" r="5" />
                <circle cx="629" cy="292" r="6" />
                <circle cx="315" cy="175" r="5" />
              </g>
              <path className="digital-intro-edge" d={brandMarkPath} />
            </svg>
            <span className="digital-intro-bloom" aria-hidden="true" />
          </div>
        </div>
      </div>
      <span className="digital-intro-a11y" role="status">جارٍ فتح الموقع</span>
      <button type="button" className="brand-intro-skip digital-intro-skip" onClick={complete}>
        تخطي المقدمة ←
      </button>
    </div>
  );
}
