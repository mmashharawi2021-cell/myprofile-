import { useEffect, useRef, useState, type RefObject } from "react";
import { approvedLogoSrc } from "./brandAsset";

type BrandIntroProps = {
  arabicName: string;
  targetRef: RefObject<HTMLSpanElement>;
  onComplete: () => void;
};

// Contours traced from the approved v2 logo preview (the artwork itself is unchanged).
const tracePaths: string[] = [
  "M 79 33 L 100 41 L 117 58 L 143 93 L 195 172 L 339 405 L 352 416 L 367 416 L 378 408 L 538 171 L 588 196 L 618 215 L 644 236 L 648 235 L 646 59 L 640 45 L 625 35 L 611 32 L 506 32 L 493 34 L 477 41 L 454 64 L 363 186 L 274 66 L 246 40 L 219 32 Z",
  "M 138 124 L 87 141 L 44 161 L 42 200 L 42 307 L 44 309 L 138 274 Z",
  "M 541 186 L 540 254 L 544 262 L 650 326 L 652 324 L 652 268 L 643 250 L 598 215 Z",
  "M 148 122 L 146 270 L 149 272 L 224 244 L 225 240 Z",
  "M 230 253 L 147 283 L 146 355 L 148 357 L 191 364 L 228 381 L 232 380 L 233 257 Z",
  "M 541 274 L 541 387 L 550 399 L 592 423 L 592 303 Z",
  "M 137 286 L 73 308 L 43 322 L 41 330 L 42 389 L 92 367 L 137 355 Z",
  "M 601 308 L 600 428 L 633 449 L 645 449 L 652 444 L 655 438 L 654 353 L 646 338 Z",
  "M 80 37 L 68 36 L 60 39 L 51 47 L 45 59 L 43 142 L 47 145 L 140 109 L 104 58 L 89 42 Z",
  "M 137 367 L 126 367 L 99 375 L 44 401 L 41 406 L 41 425 L 44 434 L 50 440 L 66 445 L 134 448 L 137 445 Z",
  "M 146 442 L 149 443 L 219 406 L 227 399 L 229 391 L 192 374 L 147 366 Z"
];
const englishName = "MUHANNAD AL-MASHHARAWI";
const subtitle = "GIS ENGINEER & WEB SYSTEMS DEVELOPER";

export default function BrandIntro({ arabicName, targetRef, onComplete }: BrandIntroProps) {
  const [running, setRunning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [given, setGiven] = useState("");
  const [surname, setSurname] = useState("");
  const [english, setEnglish] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("رسم الهوية البصرية...");
  const sourceRef = useRef<HTMLImageElement>(null);
  const flightRef = useRef<HTMLImageElement | null>(null);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    flightRef.current?.remove();
    flightRef.current = null;
    onComplete();
  };

  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const timeouts: number[] = [];
    const later = (callback: () => void, delay: number) => {
      timeouts.push(window.setTimeout(() => {
        if (!finishedRef.current) callback();
      }, delay));
    };
    const type = (text: string, setter: (value: string) => void, start: number, step: number) => {
      const chars = Array.from(text);
      chars.forEach((_, index) => later(() => setter(chars.slice(0, index + 1).join("")), start + step * index));
      return start + step * chars.length;
    };
    const frame = window.requestAnimationFrame(() => setRunning(true));
    const parts = arabicName.trim().split(/\s+/);
    const first = parts.shift() || "مهند";
    const family = parts.join(" ") || "المشهراوي";
    const firstDone = type(first, setGiven, 2320, 90);
    const arabicDone = type(family, setSurname, firstDone + 120, 82);
    const englishDone = type(englishName, setEnglish, arabicDone + 260, 37);
    later(() => { setProgress(26); setStatus("إظهار الرمز..."); }, 1300);
    later(() => { setProgress(45); setStatus("كتابة الاسم بالعربية..."); }, 2140);
    later(() => { setProgress(66); setStatus("كتابة الاسم بالإنجليزية..."); }, arabicDone + 180);
    later(() => {
      setShowSubtitle(true);
      setProgress(90);
      setStatus("تجهيز واجهة الموقع...");
    }, englishDone + 100);
    later(() => {
      if (finishedRef.current) return;
      setProgress(100);
      setStatus("الانتقال إلى الموقع...");
      const source = sourceRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      if (!source || !target || !("animate" in document.createElement("div"))) {
        finish();
        return;
      }
      const flight = document.createElement("img");
      flight.src = approvedLogoSrc;
      flight.alt = "";
      flight.setAttribute("aria-hidden", "true");
      flight.className = "brand-intro-flight";
      Object.assign(flight.style, {
        left: source.left + "px",
        top: source.top + "px",
        width: source.width + "px",
        height: source.height + "px",
      });
      document.body.appendChild(flight);
      flightRef.current = flight;
      const targetWidth = Math.min(target.width - 4, 60);
      const targetHeight = Math.min(target.height - 4, 46);
      const animation = flight.animate([
        { left: source.left + "px", top: source.top + "px", width: source.width + "px", height: source.height + "px" },
        { left: (target.left + (target.width - targetWidth) / 2) + "px",
          top: (target.top + (target.height - targetHeight) / 2) + "px",
          width: targetWidth + "px", height: targetHeight + "px" },
      ], {
        duration: 1000, easing: "cubic-bezier(.25,.8,.2,1)", fill: "forwards",
      });
      later(() => setLeaving(true), 170);
      animation.finished.then(finish).catch(finish);
    }, englishDone + 800);

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach(window.clearTimeout);
      flightRef.current?.remove();
      flightRef.current = null;
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [arabicName, targetRef, onComplete]);

  return (
    <div
      className={"brand-intro-overlay" + (running ? " is-running" : "") + (leaving ? " is-leaving" : "")}
      aria-label="مقدمة الهوية البصرية"
      role="dialog"
      aria-modal="true"
    >
      <div className="brand-intro-content">
        <span className="brand-intro-top" aria-hidden="true">MUHANNAD · PERSONAL BRAND</span>
        <div className="brand-intro-symbol">
          <svg className="brand-intro-outline" viewBox="0 0 700 465" aria-hidden="true">
            <defs>
              <linearGradient id="brandIntroTraceGradient" x1="0" y1="1" x2="1" y2="0">
                <stop stopColor="#0670dc" />
                <stop offset=".5" stopColor="#78b7ff" />
                <stop offset="1" stopColor="#1684ed" />
              </linearGradient>
            </defs>
            {tracePaths.map((d, index) => (
              <path key={index} d={d} pathLength={1000} style={{ animationDelay: (0.12 + index * 0.035) + "s" }} />
            ))}
          </svg>
          <img ref={sourceRef} src={approvedLogoSrc} className="brand-intro-original" alt="" />
        </div>
        <div className="brand-intro-ar" dir="rtl" aria-label={arabicName}>
          <span className="brand-intro-given" aria-hidden="true">{given}</span>
          <span className="brand-intro-surname" aria-hidden="true">{surname}</span>
        </div>
        <div className="brand-intro-en" dir="ltr" aria-label={englishName}>{english}</div>
        <div className={"brand-intro-sub" + (showSubtitle ? " is-visible" : "")}>
          {subtitle}
        </div>
        <div className="brand-intro-progress" aria-hidden="true">
          <span style={{ width: progress + "%" }} />
        </div>
        <span className="brand-intro-status" aria-live="polite">{status}</span>
      </div>
      <button type="button" className="brand-intro-skip" onClick={finish}>تخطي المقدمة ←</button>
    </div>
  );
}
