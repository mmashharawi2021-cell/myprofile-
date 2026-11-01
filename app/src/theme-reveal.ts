import { flushSync } from "react-dom";

type ThemeMode = "light" | "dark";

let transitionActive = false;

/** Reveal the next color palette from the center of the theme toggle button. */
export function revealThemeFromButton(
  button: HTMLButtonElement,
  next: ThemeMode,
  updateTheme: () => void,
): void {
  if (transitionActive) return;

  const apply = () => {
    // Set the CSS palette during the View Transition's DOM update callback.
    document.documentElement.dataset.theme = next;
    flushSync(updateTheme);
    try {
      localStorage.setItem("portfolio-theme-choice", next);
    } catch {
      // Theme switching must still work when storage is unavailable.
    }
  };

  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  const rect = button.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);
  const radius = Math.ceil(
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ),
  );

  transitionActive = true;
  try {
    const transition = document.startViewTransition(apply);
    void transition.ready
      .then(() => {
        document.documentElement.animate(
          [
            { clipPath: "circle(0px at " + x + "px " + y + "px)" },
            { clipPath: "circle(" + radius + "px at " + x + "px " + y + "px)" },
          ],
          {
            duration: 720,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        // If rendering the animation fails, retain the successfully switched theme.
      });
    void transition.finished.then(
      () => { transitionActive = false; },
      () => { transitionActive = false; },
    );
  } catch {
    transitionActive = false;
    apply();
  }
}
