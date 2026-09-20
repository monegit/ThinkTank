import { useEffect, useMemo, useRef, useState } from "react";
import { buildMockupPreview } from "../mockupPreview";
import type { SelectedElement } from "../elementPicker";

export function useElementPicker(html: string | undefined, folder: string | null, hidden: boolean) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const token = useMemo(() => crypto.randomUUID(), [html, folder]);
  const preview = useMemo(() => html === undefined ? "" : buildMockupPreview(html, token), [html, token]);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ token: string; element: SelectedElement } | null>(null);
  const active = !hidden && activeToken === token;
  const selection = selected?.token === token ? selected.element : null;
  const sync = () => iframeRef.current?.contentWindow?.postMessage({ type: "thinktank:picker-mode", token, active }, "*");
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.token !== token) return;
      if (event.data.type === "thinktank:picker-ready") { sync(); return; }
      if (!active) return;
      if (event.data.type === "thinktank:picker-cancelled") { setActiveToken(null); return; }
      const element = event.data.selection;
      if (event.data.type !== "thinktank:element-selected" || !element || !Number.isInteger(element.depth) || element.depth < 0 || element.depth > 1000 || typeof element.selector !== "string" || element.selector.length > 6000 || typeof element.html !== "string" || element.html.length > 6000 || typeof element.text !== "string" || element.text.length > 300) return;
      setSelected({ token, element: { selector: element.selector, depth: element.depth, html: element.html, text: element.text } });
      setActiveToken(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveToken(null); };
    window.addEventListener("message", receive);
    window.addEventListener("keydown", escape);
    sync();
    return () => { window.removeEventListener("message", receive); window.removeEventListener("keydown", escape); };
  }, [token, active]);
  useEffect(() => { if (hidden) setActiveToken(null); }, [hidden]);
  return { iframeRef, preview, active, selection, sync, toggle: () => setActiveToken(active ? null : token), clear: () => setSelected(null) };
}
