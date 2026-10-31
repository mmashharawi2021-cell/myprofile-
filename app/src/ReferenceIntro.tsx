import { useEffect, useRef, useState, type RefObject } from "react";
import approvedSvg from "./traced-r13-m.svg?raw";
import { approvedLogoSrc } from "./brandAsset";

type Props = {
  targetRef: RefObject<HTMLSpanElement>;
  onComplete: () => void;
};

const DRAW_DURATION_MS = 6000;
const FLIGHT_DURATION_MS = 700;

/**
 * The approved standalone preview's SVG, segment timing, map details and pin are
 * reused without alteration. At the sixth second the completed mark travels
 * into the real header logo; no second logo appears during the handoff.
 */
export default function ReferenceIntro({ targetRef, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const symbolRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<HTMLImageElement | null>(null);
  const doneRef = useRef(false);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    flightRef.current?.remove();
    flightRef.current = null;
    completeRef.current();
  };

  useEffect(() => {
    const priorOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const timeouts: number[] = [];
    const later = (callback: () => void, delay: number) => {
      timeouts.push(window.setTimeout(() => {
        if (!doneRef.current) callback();
      }, delay));
    };
    // Preload precisely the same completed SVG displayed by the destination brand.
    const preloaded = new Image();
    preloaded.src = approvedLogoSrc;
    const frame = window.requestAnimationFrame(() => setRunning(true));

    later(() => {
      const source = symbolRef.current?.getBoundingClientRect();
      const target = targetRef.current?.getBoundingClientRect();
      const supported = typeof document.createElement("div").animate === "function";
      if (!source || !target || target.width < 8 || target.height < 8 || !supported) {
        finish();
        return;
      }

      const flight = document.createElement("img");
      flight.src = approvedLogoSrc;
      flight.alt = "";
      flight.setAttribute("aria-hidden", "true");
      flight.className = "brand-intro-flight reference-intro-flight";
      Object.assign(flight.style, {
        left: source.left + "px",
        top: source.top + "px",
        width: source.width + "px",
        height: source.height + "px",
      });
      document.body.appendChild(flight);
      flightRef.current = flight;

      // The copy is present before the inline SVG is hidden: only one M is visible.
      symbolRef.current?.classList.add("is-flying");

      const tw = Math.min(Math.max(target.width - 4, 1), 66);
      const th = Math.min(Math.max(target.height - 4, 1), 56);
      const destination = {
        left: target.left + (target.width - tw) / 2,
        top: target.top + (target.height - th) / 2,
        width: tw,
        height: th,
      };

      const animation = flight.animate([
        { left: source.left + "px", top: source.top + "px",
          width: source.width + "px", height: source.height + "px" },
        { left: destination.left + "px", top: destination.top + "px",
          width: destination.width + "px", height: destination.height + "px" },
      ], {
        duration: FLIGHT_DURATION_MS,
        easing: "cubic-bezier(.25,.8,.2,1)",
        fill: "forwards",
      });
      later(() => setLeaving(true), 110);
      void animation.finished.then(finish).catch(finish);
    }, DRAW_DURATION_MS);
    later(finish, DRAW_DURATION_MS + FLIGHT_DURATION_MS + 1400);

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    document.addEventListener("keydown", onEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach(window.clearTimeout);
      document.removeEventListener("keydown", onEscape);
      flightRef.current?.remove();
      flightRef.current = null;
      document.documentElement.style.overflow = priorOverflow;
    };
  }, [targetRef]);

  return (
    <div
      className={"brand-intro-overlay reference-intro" +
        (running ? " is-running" : "") + (leaving ? " is-leaving" : "")}
      role="dialog"
      aria-modal="true"
      aria-label="مقدمة رسم الشعار الجغرافي"
    >
      <div className="reference-intro-scene">
        <div className="glitch-lines" aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: GLITCH_LINES }} />
        <div className="stage-glow" aria-hidden="true" />
        <div ref={symbolRef} className="reference-intro-symbol"
          dangerouslySetInnerHTML={{ __html: approvedSvg }} />
      </div>
      <span className="reference-intro-sr" role="status">جارٍ فتح الموقع</span>
      <button type="button" className="brand-intro-skip" onClick={finish}>
        تخطي المقدمة ←
      </button>
    </div>
  );
}

// Authored, static decorations copied from the approved standalone preview.
// There is no remote HTML, network content, or user input in these SVG/DOM layers.
const GLITCH_LINES = "<span class=\"glitch-line cyan\" style=\"left:12%;top:20%;width:66%;--gdelay:0.160s\"></span>\n<span class=\"glitch-line white\" style=\"left:24%;top:26%;width:34%;--gdelay:0.275s\"></span>\n<span class=\"glitch-line blue\" style=\"left:17%;top:33%;width:28%;--gdelay:0.390s\"></span>\n<span class=\"glitch-line red\" style=\"left:67%;top:30%;width:21%;--gdelay:0.505s\"></span>\n<span class=\"glitch-line cyan\" style=\"left:46%;top:38%;width:20%;--gdelay:0.620s\"></span>\n<span class=\"glitch-line green\" style=\"left:10%;top:44%;width:29%;--gdelay:0.735s\"></span>\n<span class=\"glitch-line cyan\" style=\"left:77%;top:42%;width:15%;--gdelay:0.850s\"></span>\n<span class=\"glitch-line red\" style=\"left:31%;top:55%;width:22%;--gdelay:0.965s\"></span>\n<span class=\"glitch-line blue\" style=\"left:75%;top:60%;width:18%;--gdelay:1.080s\"></span>\n<span class=\"glitch-line cyan\" style=\"left:18%;top:64%;width:25%;--gdelay:1.195s\"></span>\n<span class=\"glitch-line white\" style=\"left:42%;top:74%;width:29%;--gdelay:1.310s\"></span>\n<span class=\"glitch-line yellow\" style=\"left:61%;top:77%;width:15%;--gdelay:1.425s\"></span>\n<span class=\"glitch-line cyan\" style=\"left:32%;top:24%;width:20%;--gdelay:1.540s\"></span>\n<span class=\"glitch-line blue\" style=\"left:55%;top:65%;width:34%;--gdelay:1.655s\"></span>\n<span class=\"glitch-line cyan\" style=\"left:3%;top:53%;width:15%;--gdelay:1.770s\"></span>\n<span class=\"glitch-line white\" style=\"left:83%;top:49%;width:9%;--gdelay:1.885s\"></span>";
