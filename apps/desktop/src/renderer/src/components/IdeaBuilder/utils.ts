import type { GeneratedFile, GeneratedProject } from "./types";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const component = (name: string, content: string): GeneratedFile => ({ path: `components/${name}.html`, content });

export function generateProject(idea: string): GeneratedProject {
  const cleanIdea = idea.trim();
  const safeName = escapeHtml(cleanIdea.split(/[.!?\n]/)[0].slice(0, 42) || "새로운 아이디어");
  const hero = `<section class="hero"><span class="eyebrow">NEW IDEA</span><h1>${safeName}</h1><p>${escapeHtml(cleanIdea)}</p><a class="button" href="#features">둘러보기</a></section>`;
  const features = `<section class="features" id="features"><article><b>빠른 시작</b><p>핵심 기능을 바로 경험할 수 있습니다.</p></article><article><b>간결한 구조</b><p>필요한 정보에 쉽게 도달합니다.</p></article><article><b>확장 가능</b><p>아이디어에 맞춰 자유롭게 발전시켜 보세요.</p></article></section>`;
  const footer = `<footer><strong>${safeName}</strong><span>아이디어에서 시작된 작은 프로토타입</span></footer>`;
  const css = `*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui;color:#172033;background:#f7f7fb}.page{max-width:1040px;margin:auto;padding:32px}.hero{padding:84px 56px;border-radius:28px;background:#171a2b;color:white}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;color:#a5b4fc}.hero h1{max-width:720px;margin:14px 0;font-size:52px;line-height:1.05}.hero p{max-width:680px;color:#cbd0df;line-height:1.7}.button{display:inline-block;margin-top:18px;padding:13px 18px;border-radius:12px;background:#6366f1;color:white;text-decoration:none;font-weight:700}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px 0}.features article{padding:24px;border:1px solid #e4e5eb;border-radius:18px;background:white}.features p{color:#687086;line-height:1.6}footer{display:flex;justify-content:space-between;padding:24px 4px;color:#687086}@media(max-width:700px){.page{padding:16px}.hero{padding:48px 28px}.hero h1{font-size:36px}.features{grid-template-columns:1fr}footer{flex-direction:column;gap:8px}}`;
  const body = `<main class="page">${hero}${features}${footer}</main>`;
  const document = `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeName}</title><link rel="stylesheet" href="styles.css"></head><body>${body}</body></html>`;
  return { files: [component("Hero", hero), component("Features", features), component("Footer", footer), { path: "styles.css", content: css }, { path: "index.html", content: document }], preview: document.replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`) };
}
