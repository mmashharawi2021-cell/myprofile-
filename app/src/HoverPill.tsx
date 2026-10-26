import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";

type Box = { x: number; y: number; w: number; h: number };

// One highlight shared by a group of tabs: it glides from item to item on
// hover or keyboard focus, and settles on the active item (or fades out when
// there is none) once the pointer leaves the group.
export function useHoverPill<T extends HTMLElement>(
  activeSelector?: string,
  activeKey?: unknown,
) {
  const ref = useRef<T>(null);
  const shown = useRef(false);
  const [state, setState] = useState<{
    box: Box | null;
    visible: boolean;
    instant: boolean;
  }>({ box: null, visible: false, instant: true });

  const itemOf = (target: EventTarget | null) => {
    let node = target instanceof HTMLElement ? target : null;
    while (node && node.parentElement !== ref.current) node = node.parentElement;
    return node && !node.classList.contains("hover-pill") ? node : null;
  };
  const show = (item: HTMLElement) => {
    setState({
      box: {
        x: item.offsetLeft,
        y: item.offsetTop,
        w: item.offsetWidth,
        h: item.offsetHeight,
      },
      visible: true,
      instant: !shown.current,
    });
    shown.current = true;
  };
  const rest = useCallback(() => {
    const active = activeSelector
      ? ref.current?.querySelector<HTMLElement>(activeSelector)
      : null;
    if (active) return show(active);
    shown.current = false;
    setState((current) => ({ ...current, visible: false }));
  }, [activeSelector]);

  useLayoutEffect(() => {
    rest();
    // Re-measure when fonts load or the group reflows, so the pill stays aligned.
    const observer = new ResizeObserver(() => rest());
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rest, activeKey]);

  const moveTo = (target: EventTarget | null) => {
    const item = itemOf(target);
    if (item) show(item);
  };
  const { box, visible, instant } = state;
  return {
    ref,
    handlers: {
      onPointerOver: (event: PointerEvent) => moveTo(event.target),
      onPointerLeave: rest,
      onFocus: (event: FocusEvent) => moveTo(event.target),
      onBlur: (event: FocusEvent) => {
        if (!ref.current?.contains(event.relatedTarget as Node)) rest();
      },
    },
    pill: (
      <span
        className={`hover-pill${visible ? " is-visible" : ""}${instant ? " is-instant" : ""}`}
        aria-hidden="true"
        style={
          box
            ? {
                width: box.w,
                height: box.h,
                transform: `translate(${box.x}px, ${box.y}px)`,
              }
            : undefined
        }
      />
    ),
  };
}
