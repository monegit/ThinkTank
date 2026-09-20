export interface SelectedElement {
  selector: string;
  depth: number;
  text: string;
  html: string;
}

/** Runs inside the sandboxed preview; all dependencies must stay inside this function. */
export function installElementPicker(token: string) {
  let active = false;
  let overlay: HTMLDivElement | null = null;
  const send = (type: string, selection?: SelectedElement) => parent.postMessage({ type, token, selection }, "*");
  const clear = () => { overlay?.remove(); overlay = null; };
  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.data?.token !== token || event.data.type !== "thinktank:picker-mode") return;
    active = event.data.active === true;
    if (!active) clear();
  });
  window.addEventListener("pointermove", (event) => {
    if (!active || !(event.target instanceof Element)) return;
    const firstHover = !overlay;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText = "position:fixed;left:0;top:0;pointer-events:none;z-index:2147483647;border:2px solid #6366f1;background:rgba(99,102,241,.12);box-sizing:border-box;will-change:transform,width,height;";
    }
    const rect = event.target.getBoundingClientRect();
    const transition = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "none"
      : "transform 240ms cubic-bezier(0.22,1,0.36,1), width 240ms cubic-bezier(0.22,1,0.36,1), height 240ms cubic-bezier(0.22,1,0.36,1), border-radius 240ms cubic-bezier(0.22,1,0.36,1)";
    if (!firstHover) overlay.style.transition = transition;
    Object.assign(overlay.style, {
      transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
      width: `${rect.width}px`, height: `${rect.height}px`,
      borderRadius: getComputedStyle(event.target).borderRadius,
    });
    if (firstHover) {
      document.documentElement.append(overlay);
      // Start at the first element, then retarget this same outline from its current animated position.
      overlay.getBoundingClientRect();
      overlay.style.transition = transition;
    }
    event.stopImmediatePropagation();
  }, true);
  for (const type of ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "contextmenu"]) {
    window.addEventListener(type, (event) => { if (active) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  }
  window.addEventListener("click", (event) => {
    if (!active || !(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = event.target;
    clear();
    const path: string[] = [];
    for (let current: Element | null = target; current; current = current.parentElement) {
      const siblings = current.parentElement ? [...current.parentElement.children].filter((item) => item.localName === current!.localName) : [current];
      path.unshift(`${CSS.escape(current.localName)}:nth-of-type(${siblings.indexOf(current) + 1})`);
    }
    active = false;
    const clone = target.cloneNode(true) as Element;
    clone.querySelectorAll("[data-thinktank-preview]").forEach((element) => element.remove());
    send("thinktank:element-selected", { selector: path.join(" > ").slice(0, 6000), depth: path.length - 1, text: (clone.textContent || "").trim().slice(0, 300), html: clone.outerHTML.slice(0, 6000) });
  }, true);
  window.addEventListener("keydown", (event) => {
    if (active && event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); active = false; clear(); send("thinktank:picker-cancelled"); }
  }, true);
  send("thinktank:picker-ready");
}
