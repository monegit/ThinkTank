import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { is } from "@electron-toolkit/utils";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { access, readFile, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { readSettings, saveSettings, type CliProvider, type ReasoningEffort } from "./settings";
import { findCliExecutable } from "./cli-executable";
import { listCliModels, validateCliModel } from "./cli-models";
import { loadProject } from "./project-loader";
import { createProgressParser, type CliProgress } from "./cli-progress";
import { StringDecoder } from "node:string_decoder";

import { buildHarnessPrompt, HARNESS_VERSION, type HarnessMode, type HarnessState } from "./harness";

interface GeneratedFile { path: string; content: string }
interface CodexSession extends HarnessState { sessionId: string; model?: string | null; reasoning?: ReasoningEffort | null }
// String entries from older app versions are upgraded after a successful request.
interface CodexSessionStore { sessions: Record<string, CodexSession | string> }
interface CodexRunResult { response: string; sessionId: string | null }
let codexSessionStore: CodexSessionStore | null = null;
const activeChats = new Map<string, AbortController>();

function getCodexSessionKey(folder: string, provider: CliProvider = "codex") { return `${provider === "codex" ? "project" : "claude"}:${resolve(folder)}`; }
function getCodexSessionStorePath() { return join(app.getPath("userData"), "codex-sessions.json"); }

async function loadCodexSessionStore() {
  if (codexSessionStore) return codexSessionStore;
  try {
    const stored = JSON.parse(await readFile(getCodexSessionStorePath(), "utf8")) as Partial<CodexSessionStore>;
    codexSessionStore = { sessions: stored.sessions && typeof stored.sessions === "object" ? stored.sessions : {} };
  } catch { codexSessionStore = { sessions: {} }; }
  return codexSessionStore;
}

async function saveCodexSessionStore() {
  const store = await loadCodexSessionStore();
  const target = getCodexSessionStorePath();
  const temporary = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  await rename(temporary, target);
}

async function setCodexSession(folder: string, session: CodexSession | null, provider: CliProvider) {
  const store = await loadCodexSessionStore();
  const key = getCodexSessionKey(folder, provider);
  if (session) store.sessions[key] = session;
  else delete store.sessions[key];
  await saveCodexSessionStore();
}

async function moveCodexSessions(fromFolder: string, toFolder: string) {
  const store = await loadCodexSessionStore();
  for (const provider of ["codex", "claude"] as const) {
    const fromKey = getCodexSessionKey(fromFolder, provider);
    const toKey = getCodexSessionKey(toFolder, provider);
    if (!store.sessions[fromKey]) continue;
    store.sessions[toKey] = store.sessions[fromKey];
    delete store.sessions[fromKey];
  }
  await saveCodexSessionStore();
}

async function deleteCodexSessions(folder: string) {
  const store = await loadCodexSessionStore();
  const target = resolve(folder);
  let changed = false;
  for (const key of Object.keys(store.sessions)) {
    const sessionFolder = key.slice(key.indexOf(":") + 1);
    if (sessionFolder === target || sessionFolder.startsWith(`${target}${sep}`)) { delete store.sessions[key]; changed = true; }
  }
  if (changed) await saveCodexSessionStore();
}

function parseCodexJsonOutput(stdout: string): CodexRunResult {
  let sessionId: string | null = null;
  let response = "";
  for (const line of stdout.split(/\r?\n/u)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as { type?: string; thread_id?: string; session_id?: string; item?: { type?: string; text?: string } };
      if (event.type === "thread.started") sessionId = event.thread_id ?? event.session_id ?? sessionId;
      if (event.type === "item.completed" && event.item?.type === "agent_message" && typeof event.item.text === "string") response = event.item.text;
    } catch { /* Ignore non-JSON diagnostics while retaining valid CLI events. */ }
  }
  return { response: response.trim(), sessionId };
}

function parseClaudeJsonOutput(stdout: string): CodexRunResult {
  const events = stdout.trim().split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
  const result = ([...events].reverse().find((event) => event.type === "result") ?? events.at(-1)) as { result?: string; session_id?: string; is_error?: boolean; errors?: string[] };
  if (!result) throw new Error("Claude CLI 응답이 없습니다.");
  if (result.is_error) throw new Error(result.result || result.errors?.join("\n") || "Claude CLI 요청에 실패했습니다.");
  if (typeof result.result !== "string") throw new Error("Claude CLI 응답 형식이 올바르지 않습니다.");
  return { response: result.result.trim(), sessionId: typeof result.session_id === "string" ? result.session_id : null };
}

async function executeAgent(folder: string, mode: HarnessMode, userRequest: string, signal?: AbortSignal, onProgress?: (progress: CliProgress) => void) {
  const { cliProvider: provider, models, reasoning } = await readSettings();
  const model = models[provider];
  const modelArgs = model ? ["--model", model] : [];
  const effort = reasoning[provider];
  const effortArgs = effort ? provider === "claude" ? ["--effort", effort] : ["-c", `model_reasoning_effort=${effort}`] : [];
  const executable = await findCliExecutable(provider);
  const label = provider === "codex" ? "Codex CLI" : "Claude CLI";
  const store = await loadCodexSessionStore();
  const existingSession = store.sessions[getCodexSessionKey(folder, provider)];
  let activeSessionId: string | null = typeof existingSession === "string" ? existingSession : existingSession?.sessionId ?? null;
  // A resumed session can retain an explicit model; start fresh when restoring CLI defaults.
  if (typeof existingSession === "object" && ((!model && existingSession.model) || (!effort && existingSession.reasoning))) activeSessionId = null;
  const run = (sessionId: string | null) => new Promise<CodexRunResult>((resolveRun, reject) => {
    if (signal?.aborted) { reject(new Error("대화를 중단했습니다.")); return; }
    const previous = sessionId && typeof existingSession === "object" ? existingSession : undefined;
    const prompt = buildHarnessPrompt(mode, userRequest, previous);
    const args = provider === "claude"
      ? ["-p", "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits", ...modelArgs, ...effortArgs, ...(sessionId ? ["--resume", sessionId] : []), prompt]
      : sessionId
      ? ["exec", "resume", "--json", "--skip-git-repo-check", ...modelArgs, ...effortArgs, sessionId, prompt]
      : ["exec", "-C", folder, "--sandbox", "workspace-write", "--skip-git-repo-check", "--json", ...modelArgs, ...effortArgs, prompt];
    const child = spawn(executable, args, { cwd: folder, env: process.env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const terminate = (terminationSignal: NodeJS.Signals) => {
      try {
        if (process.platform !== "win32" && child.pid) process.kill(-child.pid, terminationSignal);
        else child.kill(terminationSignal);
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ESRCH") child.kill(terminationSignal); }
    };
    const abort = () => {
      terminate("SIGTERM");
      killTimer = setTimeout(() => terminate("SIGKILL"), 2000);
    };
    const cleanup = () => { signal?.removeEventListener("abort", abort); clearTimeout(killTimer); };
    signal?.addEventListener("abort", abort, { once: true });
    let stdout = "";
    let stderr = "";
    let pendingLine = "";
    const decoder = new StringDecoder("utf8");
    const parseProgress = createProgressParser();
    const reportLine = (line: string) => {
      try { for (const progress of parseProgress(JSON.parse(line))) onProgress?.(progress); } catch { /* Ignore diagnostics that are not protocol events. */ }
    };
    onProgress?.({ id: "connection", label: `${label} 연결`, status: "running" });
    child.stdout.on("data", (chunk: Buffer) => {
      const text = decoder.write(chunk);
      stdout += text;
      pendingLine += text;
      let end: number;
      while ((end = pendingLine.indexOf("\n")) !== -1) { reportLine(pendingLine.slice(0, end)); pendingLine = pendingLine.slice(end + 1); }
    });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", (error) => { cleanup(); reject(new Error(error.message.includes("ENOENT") ? `${label}를 찾을 수 없습니다. 먼저 설치하고 터미널에서 로그인해 주세요.` : error.message)); });
    child.on("close", (code) => {
      cleanup();
      const tail = decoder.end();
      stdout += tail;
      if (pendingLine || tail) reportLine(pendingLine + tail);
      try {
        if (signal?.aborted) {
          const partial = provider === "codex" ? parseCodexJsonOutput(stdout) : { sessionId: null };
          resolveRun({ response: "대화를 중단했습니다.", sessionId: partial.sessionId });
          return;
        }
        if (code !== 0) {
          if (provider === "claude" && stdout.trim()) parseClaudeJsonOutput(stdout);
          throw new Error(stderr.trim() || `${label}가 종료 코드 ${code}로 실패했습니다.`);
        }
        resolveRun(provider === "claude" ? parseClaudeJsonOutput(stdout) : parseCodexJsonOutput(stdout));
      } catch (error) { reject(error); }
    });
  });
  let result: CodexRunResult;
  try { result = await run(activeSessionId); }
  catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    if (!activeSessionId || !/(session|thread|conversation).*(not found|missing|load|resume|exist)/iu.test(message)) throw caught;
    await setCodexSession(folder, null, provider);
    activeSessionId = null;
    result = await run(null);
  }
  const sessionId = result.sessionId ?? activeSessionId;
  if (sessionId) await setCodexSession(folder, { sessionId, harnessVersion: HARNESS_VERSION, mode, model, reasoning: effort }, provider);
  return result.response;
}

async function listGeneratedFiles(folder: string) {
  const entries = await readdir(folder, { recursive: true, withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1));
}

async function writeGeneratedFiles(folder: string, files: GeneratedFile[]) {
  for (const file of files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string" || file.path.includes("..") || join(file.path).startsWith("/")) throw new Error("Codex가 허용되지 않은 파일 경로를 반환했습니다.");
    const target = join(folder, file.path);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, file.content, "utf8");
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    webPreferences: { preload: join(__dirname, "../preload/index.js"), contextIsolation: true, nodeIntegration: false }
  });
  window.once("ready-to-show", () => window.show());
  if (is.dev && process.env.ELECTRON_RENDERER_URL) window.loadURL(process.env.ELECTRON_RENDERER_URL);
  else window.loadFile(join(__dirname, "../renderer/index.html"));
}

ipcMain.handle("project:select-folder", async (event) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const options = {
    title: "작업 폴더 선택",
    buttonLabel: "이 폴더 선택",
    properties: ["openDirectory", "createDirectory"] as Array<
      "openDirectory" | "createDirectory"
    >,
  };
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options);
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("project:list-folders", async (_event, folder: unknown) => {
  if (typeof folder !== "string") throw new Error("폴더 경로가 필요합니다.");
  const entries = await readdir(folder, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(entry.parentPath, entry.name).slice(folder.length + 1))
    .filter((path) => path.split("/").every((part) => !part.startsWith(".")))
    .sort((a, b) => a.localeCompare(b));
});

ipcMain.handle("project:create-empty-folder", async (_event, root: unknown) => {
  if (typeof root !== "string") throw new Error("작업 폴더가 필요합니다.");
  const rootPath = resolve(root);
  let sequence = 1;
  let title = "새 아이디어";
  let target = join(rootPath, title);
  while (true) {
    try {
      await access(target);
      sequence += 1;
      title = `새 아이디어 ${sequence}`;
      target = join(rootPath, title);
    } catch {
      break;
    }
  }
  await mkdir(target, { recursive: false });
  return { folder: target, relativeFolder: relative(rootPath, target), title };
});

ipcMain.handle("project:rename-folder", async (_event, root: unknown, relativeFolder: unknown, nextName: unknown) => {
  if (typeof root !== "string" || typeof relativeFolder !== "string" || typeof nextName !== "string") throw new Error("폴더 정보가 필요합니다.");
  const cleanName = nextName.trim();
  if (!cleanName || cleanName === "." || cleanName === ".." || cleanName.includes("/") || cleanName.includes("\\")) throw new Error("올바른 폴더명을 입력해 주세요.");
  const rootPath = resolve(root);
  const current = resolve(rootPath, relativeFolder);
  if (!current.startsWith(`${rootPath}${sep}`)) throw new Error("작업공간 밖의 폴더는 변경할 수 없습니다.");
  const target = join(dirname(current), cleanName);
  if (target !== current) {
    try { await access(target); throw new Error("같은 위치에 동일한 폴더명이 이미 있습니다."); } catch (caught) { if (caught instanceof Error && !caught.message.includes("ENOENT")) throw caught; }
    await rename(current, target);
    await moveCodexSessions(current, target);
  }
  return { folder: target, relativeFolder: relative(rootPath, target), title: cleanName };
});

ipcMain.handle("project:delete-folder", async (event, root: unknown, relativeFolder: unknown) => {
  if (typeof root !== "string" || typeof relativeFolder !== "string") throw new Error("폴더 정보가 필요합니다.");
  const rootPath = resolve(root);
  const target = resolve(rootPath, relativeFolder);
  if (!target.startsWith(`${rootPath}${sep}`)) throw new Error("작업공간 밖의 폴더는 삭제할 수 없습니다.");
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  const options = { type: "warning" as const, title: "폴더 삭제", message: `“${basename(target)}” 폴더를 삭제할까요?`, detail: "폴더 안의 모든 파일이 함께 삭제되며 되돌릴 수 없습니다.", buttons: ["취소", "삭제"], defaultId: 0, cancelId: 0 };
  const result = parentWindow ? await dialog.showMessageBox(parentWindow, options) : await dialog.showMessageBox(options);
  if (result.response !== 1) return { deleted: false };
  await rm(target, { recursive: true, force: false });
  await deleteCodexSessions(target);
  return { deleted: true };
});

ipcMain.handle("settings:get", () => readSettings());
ipcMain.handle("settings:set-provider", (_event, provider: unknown) => saveSettings(provider));
ipcMain.handle("settings:list-models", (_event, provider: unknown) => {
  if (provider !== "codex" && provider !== "claude") throw new Error("지원하지 않는 CLI입니다.");
  return listCliModels(provider);
});
ipcMain.handle("settings:set-model", async (_event, provider: unknown, model: unknown) => {
  if (provider !== "codex" && provider !== "claude") throw new Error("지원하지 않는 CLI입니다.");
  if (model !== null && (typeof model !== "string" || !model || model.length > 200)) throw new Error("올바른 모델을 선택해 주세요.");
  if (typeof model === "string") await validateCliModel(provider, model);
  return saveSettings(provider, model);
});
ipcMain.handle("settings:set-reasoning", (_event, provider: unknown, effort: unknown) => {
  if (provider !== "codex" && provider !== "claude") throw new Error("지원하지 않는 CLI입니다.");
  if (effort !== null && !["low", "medium", "high", "xhigh", "max"].includes(effort as string)) throw new Error("올바른 추론 수준을 선택해 주세요.");
  return saveSettings(provider, undefined, effort as ReasoningEffort | null);
});

ipcMain.handle("project:stop-chat", (event, requestId: unknown) => {
  if (typeof requestId !== "string") throw new Error("대화 요청 정보가 필요합니다.");
  const controller = activeChats.get(`${event.sender.id}:${requestId}`);
  controller?.abort();
  return { stopped: Boolean(controller) };
});

ipcMain.handle("project:chat", async (event, folder: unknown, message: unknown, requestId: unknown) => {
  if (typeof folder !== "string" || typeof message !== "string" || !message.trim()) throw new Error("대화 내용이 필요합니다.");
  if (typeof requestId !== "string" || !requestId || requestId.length > 100) throw new Error("대화 요청 정보가 필요합니다. 앱을 다시 실행해 주세요.");
  const key = `${event.sender.id}:${requestId}`;
  if (activeChats.has(key)) throw new Error("이미 진행 중인 대화입니다.");
  const controller = new AbortController();
  activeChats.set(key, controller);
  let reply: string;
  try { reply = (await executeAgent(folder, "conversation", message, controller.signal, (progress) => {
    if (!event.sender.isDestroyed()) event.sender.send("project:chat-progress", { requestId, progress });
  })) || "응답이 없습니다."; }
  finally { activeChats.delete(key); }
  let preview: string | null = null;
  let prompt = "";
  try { preview = await readFile(join(folder, "index.html"), "utf8"); } catch { /* A conversational answer may not create a document. */ }
  try { prompt = await readFile(join(folder, "README.md"), "utf8"); } catch { /* README is created after the first implemented change. */ }
  return { reply, preview, prompt, files: preview ? [{ path: "index.html", content: "" }, { path: "README.md", content: "" }] : [] };
});

ipcMain.handle("project:load-html", async (_event, root: unknown, relativeFolder: unknown) => {
  if (typeof root !== "string" || typeof relativeFolder !== "string") throw new Error("폴더 경로가 필요합니다.");
  return loadProject(root, relativeFolder);
});

ipcMain.handle("project:write", async (_event, folder: unknown, files: unknown) => {
  if (typeof folder !== "string" || !Array.isArray(files)) throw new Error("잘못된 프로젝트 데이터입니다.");
  await writeGeneratedFiles(folder, files as GeneratedFile[]);
  return { count: files.length };
});

ipcMain.handle("project:generate", async (_event, root: unknown, selectedFolder: unknown, title: unknown, prompt: unknown) => {
  if (typeof root !== "string" || (selectedFolder !== null && typeof selectedFolder !== "string") || typeof title !== "string" || typeof prompt !== "string" || !prompt.trim()) throw new Error("폴더명과 프롬프트가 필요합니다.");
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle === "." || cleanTitle === ".." || cleanTitle.includes("/") || cleanTitle.includes("\\")) throw new Error("폴더명에는 / 또는 \\를 사용할 수 없습니다.");
  const rootPath = resolve(root);
  const currentFolder = selectedFolder ? resolve(rootPath, selectedFolder) : null;
  if (currentFolder && !currentFolder.startsWith(`${rootPath}${sep}`)) throw new Error("선택한 작업공간 밖의 폴더는 수정할 수 없습니다.");
  const parentFolder = currentFolder ? dirname(currentFolder) : rootPath;
  const targetFolder = join(parentFolder, cleanTitle);
  if (targetFolder !== currentFolder) {
    try { await access(targetFolder); throw new Error("같은 위치에 동일한 폴더명이 이미 있습니다."); } catch (caught) { if (caught instanceof Error && !caught.message.includes("ENOENT")) throw caught; }
  }
  const workingFolder = currentFolder ?? targetFolder;
  if (!currentFolder) await mkdir(workingFolder, { recursive: false });
  await executeAgent(workingFolder, "document", prompt);
  if (currentFolder && targetFolder !== currentFolder) {
    await rename(currentFolder, targetFolder);
    await moveCodexSessions(currentFolder, targetFolder);
  }
  const indexPath = join(targetFolder, "index.html");
  let index: string;
  try { index = await readFile(indexPath, "utf8"); }
  catch { throw new Error("CLI 실행은 끝났지만 index.html이 생성되지 않았습니다."); }
  await writeFile(join(targetFolder, "README.md"), `# 생성 프롬프트\n\n${prompt.trim()}\n`, "utf8");
  return { folder: targetFolder, relativeFolder: relative(rootPath, targetFolder), files: [{ path: "index.html", content: "" }, { path: "README.md", content: "" }], preview: index };
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
