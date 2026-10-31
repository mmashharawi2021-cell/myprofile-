import { useEffect, useRef, useState, type RefObject } from "react";
import { approvedLogoSrc, brandMarkPath } from "./brandAsset";

type BrandIntroProps = {
  arabicName: string;
  targetRef: RefObject<HTMLSpanElement>;
  onComplete: () => void;
};

const englishName = "MUHANAD AL-MASHHARAWI";
const subtitle = "GIS ENGINEER & WEB SYSTEMS DEVELOPER";

// The logo itself is one reusable SVG: the laser and the header image share its M contour.
export default function BrandIntro({ arabicName, targetRef, onComplete }: BrandIntroProps) {
  const [running, setRunning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showArabic, setShowArabic] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("رسم الشعار بالليزر...");
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
    const frame = window.requestAnimationFrame(() => setRunning(true));

    later(() => { setProgress(24); setStatus("تشكيل الحواف الضوئية..."); }, 520);
    later(() => { setProgress(53); setStatus("تثبيت الهوية الرقمية..."); }, 1160);
    later(() => { setShowArabic(true); setProgress(72); setStatus("إظهار الاسم..."); }, 1470);
    later(() => { setShowEnglish(true); setProgress(84); }, 1690);
    later(() => { setShowSubtitle(true); setProgress(94); }, 1910);

    // Do not prolong a simulated "loading" bar beyond the actual introduction.
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
      // Make the original mark invisible *in the same frame* as the flying copy.
      // Only one full logo is ever visible while it travels to the header.
      sourceRef.current?.closest(".brand-intro-symbol")?.classList.add("is-flying");
      const targetWidth = Math.min(target.width - 4, 60);
      const targetHeight = Math.min(target.height - 4, 46);
      const animation = flight.animate([
        { left: source.left + "px", top: source.top + "px", width: source.width + "px", height: source.height + "px" },
        { left: (target.left + (target.width - targetWidth) / 2) + "px",
          top: (target.top + (target.height - targetHeight) / 2) + "px",
          width: targetWidth + "px", height: targetHeight + "px" },
      ], {
        duration: 720, easing: "cubic-bezier(.25,.8,.2,1)", fill: "forwards",
      });
      later(() => setLeaving(true), 100);
      animation.finished.then(finish).catch(finish);
    }, 2700);

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach(window.clearTimeout);
      flightRef.current?.remove();
      flightRef.current = null;
      document.documentElement.style.overflow = originalOverflow;
    };
  }, [onComplete, targetRef]);

  const parts = arabicName.trim().split(/\s+/);
  const firstName = parts.shift() || "مهند";
  const familyName = parts.join(" ") || "المشهراوي";

  return (
    <div
      className={"brand-intro-overlay brand-intro-laser-glitch" +
        (running ? " is-running" : "") + (leaving ? " is-leaving" : "")}
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
                <stop offset=".5" stopColor="#b7efff" />
                <stop offset="1" stopColor="#00c8f0" />
              </linearGradient>
              <linearGradient id="brandIntroSweepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#61d9ff" stopOpacity="0" />
                <stop offset=".45" stopColor="#a8eeff" stopOpacity=".05" />
                <stop offset=".72" stopColor="#b1efff" stopOpacity=".24" />
                <stop offset="1" stopColor="#e1faff" stopOpacity=".76" />
              </linearGradient>
              <clipPath id="brandIntroLaserClip">
                <path d={brandMarkPath} />
              </clipPath>
            </defs>
            <path className="brand-intro-laser-halo" d={brandMarkPath} pathLength={1000} />
            <path className="brand-intro-laser-core" d={brandMarkPath} pathLength={1000} />
            <g clipPath="url(#brandIntroLaserClip)">
              <rect className="brand-intro-laser-sweep"
                x="0" y="0" width="785" height="30" fill="url(#brandIntroSweepGradient)" />
            </g>
          </svg>
          <div className="brand-intro-mark-stack">
            <img ref={sourceRef} src={approvedLogoSrc} className="brand-intro-original" alt="" />
            <img src={approvedLogoSrc} className="brand-intro-glitch-copy brand-intro-glitch-upper" alt=""
              aria-hidden="true" draggable={false} />
            <img src={approvedLogoSrc} className="brand-intro-glitch-copy brand-intro-glitch-lower" alt=""
              aria-hidden="true" draggable={false} />
          </div>
        </div>
        <div className={"brand-intro-ar" + (showArabic ? " is-visible" : "")}
          dir="rtl" aria-label={arabicName}>
          <span className="brand-intro-given" aria-hidden="true">{showArabic ? firstName : ""}</span>
          <span className="brand-intro-surname" aria-hidden="true">{showArabic ? familyName : ""}</span>
        </div>
        <div className={"brand-intro-en" + (showEnglish ? " is-visible" : "")}
          dir="ltr" aria-label={englishName}>{showEnglish ? englishName : ""}</div>
        <div className={"brand-intro-sub" + (showSubtitle ? " is-visible" : "")}>{subtitle}</div>
        <div className="brand-intro-progress" aria-hidden="true">
          <span style={{ width: progress + "%" }} />
        </div>
        <span className="brand-intro-status" aria-live="polite">{status}</span>
      </div>
      <button type="button" className="brand-intro-skip" onClick={finish}>تخطي المقدمة ←</button>
    </div>
  );
}
