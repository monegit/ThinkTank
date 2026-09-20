/** Keeps mockup form interactions in the preview instead of navigating or posting data. */
export function buildMockupPreview(html: string, pickerToken?: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const guard = document.createElement("script");
  guard.setAttribute("data-thinktank-preview", "true");
  // Cancel only the browser default; the mockup's own submit handlers still run.
  guard.textContent = `
    document.addEventListener("submit", function (event) { event.preventDefault(); }, true);
    // Direct submit() bypasses submit events; mockups must not post data or navigate.
    HTMLFormElement.prototype.submit = function () {};
  `;
  if (pickerToken) guard.textContent += `\n(${installElementPicker.toString()})(${JSON.stringify(pickerToken)});`;
  document.head.prepend(guard);
  const doctype = document.doctype ? new XMLSerializer().serializeToString(document.doctype) : "<!doctype html>";
  return `${doctype}\n${document.documentElement.outerHTML}`;
}
import { installElementPicker } from "./elementPicker";
