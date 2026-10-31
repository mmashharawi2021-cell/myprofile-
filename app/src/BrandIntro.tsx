import { useEffect, useRef, useState, type RefObject } from "react";
import { approvedLogoSrc, brandMarkPath } from "./brandAsset";

type BrandIntroProps = {
  arabicName: string;
  targetRef: RefObject<HTMLSpanElement>;
  onComplete: () => void;
};

// Contours traced from the approved v2 logo preview (the artwork itself is unchanged).
const tracePaths: string[] = [brandMarkPath];
const englishName = "MUHANAD AL-MASHHARAWI";
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
        <span className="brand-intro-top" aria-hidden="true">MUHANAD · PERSONAL BRAND</span>
        <div className="brand-intro-symbol">
          <svg className="brand-intro-outline" viewBox="0 0 785 575" aria-hidden="true">
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
          {/* Decorative GIS orbits. The approved V4 monogram and its flight remain untouched. */}
          <svg
            className="brand-intro-orbital-scene"
            viewBox="0 0 640 450"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="brandIntroOrbitGradient" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#1684ed" stopOpacity=".16" />
                <stop offset=".5" stopColor="#8cdcff" stopOpacity=".9" />
                <stop offset="1" stopColor="#00c8f0" stopOpacity=".23" />
              </linearGradient>
              <linearGradient id="brandIntroScanGradient" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#5bafff" stopOpacity=".56" />
                <stop offset="1" stopColor="#00c8f0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <ellipse
              id="brandIntroObservationOrbit"
              className="brand-intro-orbit-line brand-intro-orbit-line-one"
              cx="320" cy="225" rx="252" ry="116"
              transform="rotate(-23 320 225)"
              pathLength={1000}
            />
            <ellipse
              id="brandIntroCommunicationOrbit"
              className="brand-intro-orbit-line brand-intro-orbit-line-two"
              cx="320" cy="225" rx="231" ry="106"
              transform="rotate(31 320 225)"
              pathLength={1000}
            />
            <g className="brand-intro-satellite brand-intro-satellite-observation">
              <animateMotion dur="7.2s" repeatCount="indefinite" rotate="auto" begin="0.15s">
                <mpath href="#brandIntroObservationOrbit" />
              </animateMotion>
              <g className="brand-intro-satellite-art">
                <path
                  className="brand-intro-scan-beam"
                  d="M-5 15 L-17 47 Q0 53 17 47 L5 15Z"
                  fill="url(#brandIntroScanGradient)"
                />
                <path d="M-17 0H-12 M12 0H17" stroke="#bfefff" strokeWidth="2" />
                <rect x="-42" y="-10" width="25" height="20" rx="2"
                  fill="#125c9b" stroke="#8bd7ff" strokeWidth="1.6" />
                <rect x="17" y="-10" width="25" height="20" rx="2"
                  fill="#125c9b" stroke="#8bd7ff" strokeWidth="1.6" />
                <path d="M-34 -10V10 M-25 -10V10 M25 -10V10 M34 -10V10"
                  stroke="#bfefff" strokeWidth="1" opacity=".72" />
                <rect x="-12" y="-13" width="24" height="26" rx="5"
                  fill="#d9f8ff" stroke="#259de9" strokeWidth="2" />
                <rect x="-6" y="-8" width="12" height="16" rx="2" fill="#176dc2" />
                <circle cx="0" cy="0" r="3" fill="#92ecff" />
                <path d="M0 -13V-20 M-5 -20H5" stroke="#bfefff" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
            <g className="brand-intro-satellite brand-intro-satellite-communications">
              <animateMotion
                dur="9.1s" repeatCount="indefinite" rotate="auto"
                begin="0.2s" keyPoints="1;0" keyTimes="0;1" calcMode="linear"
              >
                <mpath href="#brandIntroCommunicationOrbit" />
              </animateMotion>
              <g className="brand-intro-satellite-art">
                <rect x="-32" y="-8" width="21" height="16" rx="2"
                  fill="#125c9b" stroke="#8bd7ff" strokeWidth="1.5" />
                <rect x="11" y="-8" width="21" height="16" rx="2"
                  fill="#125c9b" stroke="#8bd7ff" strokeWidth="1.5" />
                <path d="M-25 -8V8 M-18 -8V8 M18 -8V8 M25 -8V8"
                  stroke="#bfefff" strokeWidth="1" opacity=".7" />
                <rect x="-11" y="-11" width="22" height="22" rx="5"
                  fill="#c6eeff" stroke="#1684ed" strokeWidth="2" />
                <circle cx="0" cy="0" r="4" fill="#1684ed" />
                <path d="M3 -11 L12 -22 M7 -26 Q18 -25 21 -14 Q11 -14 7 -26Z"
                  fill="#c4eaff" stroke="#8bd7ff" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="12" cy="-22" r="2" fill="#e6fbff" />
              </g>
            </g>
          </svg>
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
