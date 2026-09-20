import { readFile, readdir } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";

const EMPTY_PREVIEW = "<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;background:#fff}</style></head><body></body></html>";

/** Loads a project's saved contents regardless of its folder name. */
export async function loadProject(root: string, relativeFolder: string) {
  const rootPath = resolve(root);
  const target = resolve(rootPath, relativeFolder);
  if (target !== rootPath && !target.startsWith(`${rootPath}${sep}`)) throw new Error("선택한 작업공간 밖의 폴더는 열 수 없습니다.");
  const title = basename(target);
  // Check that the folder exists before treating a missing document as a draft.
  const entries = await readdir(target);
  let preview: string;
  let isDraft = false;
  try {
    preview = await readFile(join(target, "index.html"), "utf8");
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("index.html을 읽지 못했습니다. 파일 형식과 읽기 권한을 확인해 주세요.");
    // Empty folders and README-only ideas are drafts; metadata does not make an idea complete.
    if (entries.some((name) => !name.startsWith(".") && name !== "README.md")) throw new Error("선택한 폴더에 index.html이 없습니다.");
    preview = EMPTY_PREVIEW;
    isDraft = true;
  }
  const files = isDraft ? [] : [{ path: "index.html", content: "" }];
  let prompt = "";
  try {
    prompt = (await readFile(join(target, "README.md"), "utf8")).replace(/^# 생성 프롬프트\s*/u, "").trim();
    files.push({ path: "README.md", content: "" });
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("README.md를 읽지 못했습니다. 파일 형식과 읽기 권한을 확인해 주세요.");
  }
  return { folder: target, title, prompt, preview, files, isDraft };
}
