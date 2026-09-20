const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

test("picker reports exact ancestor depth, sibling position and stops selection clicks", async (t) => {
  const source = await readFile(join(__dirname, "../src/renderer/src/components/IdeaBuilder/elementPicker.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  const { installElementPicker } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  const listeners = new Map();
  const sent = [];
  class Element {
    constructor(name, parent = null) { this.localName = name; this.parentElement = parent; this.children = []; this.textContent = "Selected button"; this.outerHTML = `<${name}>Selected button</${name}>`; parent?.children.push(this); }
    cloneNode() { return this; }
    querySelectorAll() { return []; }
  }
  const mocks = { window: { addEventListener: (type, handler) => { listeners.set(type, handler); } }, parent: { postMessage: value => sent.push(value) }, Element, CSS: { escape: value => value } };
  for (const [key, value] of Object.entries(mocks)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, key, previous); else delete globalThis[key]; });
  }
  installElementPicker("preview-token");
  const html = new Element("html"); const body = new Element("body", html); const main = new Element("main", body);
  new Element("button", main); const button = new Element("button", main);
  const dispatchMode = (token, active) => listeners.get("message")({ source: mocks.parent, data: { type: "thinktank:picker-mode", token, active } });
  let prevented = false;
  let stopped = false;
  const click = { target: button, preventDefault: () => { prevented = true; }, stopImmediatePropagation: () => { stopped = true; } };
  dispatchMode("wrong-token", true);
  listeners.get("click")(click);
  assert.equal(prevented, false);
  dispatchMode("preview-token", true);
  listeners.get("click")(click);
  assert.equal(prevented, true); assert.equal(stopped, true);
  const result = sent.at(-1);
  assert.equal(result.type, "thinktank:element-selected");
  assert.equal(result.selection.depth, 3);
  assert.equal(result.selection.selector, "html:nth-of-type(1) > body:nth-of-type(1) > main:nth-of-type(1) > button:nth-of-type(2)");
  assert.equal(result.selection.html, button.outerHTML);
  prevented = false;
  listeners.get("click")(click);
  assert.equal(prevented, false);
  dispatchMode("preview-token", true);
  listeners.get("keydown")({ key: "Escape", preventDefault() {}, stopImmediatePropagation() {} });
  assert.equal(sent.at(-1).type, "thinktank:picker-cancelled");
});
