import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const MIN_WIDTH = 300;
const maximumWidth = () => Math.max(MIN_WIDTH, Math.min(600, (window.innerWidth - 304) / 2));
const clampWidth = (width: number) => Math.max(MIN_WIDTH, Math.min(maximumWidth(), width));

export function useSidebarResize(side: "left" | "right" = "left") {
  const direction = side === "left" ? 1 : -1;
  const [width, setWidth] = useState(MIN_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [maxWidth, setMaxWidth] = useState(maximumWidth);
  const drag = useRef<{ x: number; width: number; pointerId: number } | null>(null);
  const endDrag = () => { drag.current = null; setDragging(false); };

  useEffect(() => {
    const resize = () => { setMaxWidth(maximumWidth()); setWidth((value) => clampWidth(value)); };
    window.addEventListener("resize", resize);
    window.addEventListener("blur", endDrag);
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("blur", endDrag); };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width, pointerId: event.pointerId };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    setWidth(clampWidth(drag.current.width + (event.clientX - drag.current.x) * direction));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endDrag();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 50 : 10;
    setWidth((value) => clampWidth(event.key === "Home" ? MIN_WIDTH : event.key === "End" ? maximumWidth() : value + (event.key === "ArrowRight" ? step : -step) * direction));
  };
  return {
    width, collapsed, dragging, minWidth: MIN_WIDTH, maxWidth,
    toggle: () => { endDrag(); setCollapsed((value) => !value); },
    resizeHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onLostPointerCapture: endDrag, onKeyDown },
  };
}
