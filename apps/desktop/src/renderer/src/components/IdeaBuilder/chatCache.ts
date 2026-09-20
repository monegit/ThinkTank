import type { ChatMessage } from "./types";
import type { SelectedElement } from "./elementPicker";
import type { ChatProgressEvent, CliProgress } from "../../../../cli-progress";

interface ChatState { messages: ChatMessage[]; input: string; isReplying: boolean; isStopping: boolean; progress: CliProgress[] }
interface ChatEntry { state: ChatState; requestId?: string }
const EMPTY_CHAT: ChatState = { messages: [], input: "", isReplying: false, isStopping: false, progress: [] };

/** Holds temporary conversations for one mounted idea builder. */
export function createChatCache() {
  const entries = new Map<string, ChatEntry>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const entryFor = (folder: string) => {
    let entry = entries.get(folder);
    if (!entry) { entry = { state: { ...EMPTY_CHAT, messages: [] } }; entries.set(folder, entry); }
    return entry;
  };
  const update = (entry: ChatEntry, change: Partial<ChatState>) => {
    entry.state = { ...entry.state, ...change };
    notify();
  };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    get(folder: string | null) { return folder ? entries.get(folder)?.state ?? EMPTY_CHAT : EMPTY_CHAT; },
    reportProgress(event: ChatProgressEvent) {
      const entry = [...entries.values()].find((entry) => entry.requestId === event.requestId);
      if (!entry) return;
      const progress = entry.state.progress.filter((item) => item.id !== event.progress.id);
      update(entry, { progress: [...progress, event.progress].slice(-40) });
    },
    setInput(folder: string | null, input: string) { if (folder) update(entryFor(folder), { input }); },
    async send(folder: string | null, request: (folder: string, message: string, requestId: string) => Promise<string>, selectedElement?: SelectedElement | null) {
      if (!folder) return;
      const entry = entryFor(folder);
      const content = entry.state.input.trim();
      if (!content || entry.state.isReplying) return;
      entry.requestId = crypto.randomUUID();
      update(entry, { input: "", progress: [], isReplying: true, messages: [...entry.state.messages, { role: "user", content, ...(selectedElement ? { selectedElement } : {}) }] });
      try {
        const reply = await request(folder, content, entry.requestId);
        update(entry, { messages: [...entry.state.messages, { role: "agent", content: reply }] });
      } catch (caught) {
        update(entry, { messages: [...entry.state.messages, { role: "agent", content: caught instanceof Error ? caught.message : "응답을 받지 못했습니다." }] });
      } finally { entry.requestId = undefined; update(entry, { isReplying: false, isStopping: false }); }
    },
    async stop(folder: string | null, cancel: (requestId: string) => Promise<unknown>) {
      const entry = folder ? entries.get(folder) : undefined;
      if (!entry?.requestId || !entry.state.isReplying || entry.state.isStopping) return;
      const requestId = entry.requestId;
      update(entry, { isStopping: true });
      try { await cancel(requestId); }
      catch {
        if (entry.requestId === requestId) update(entry, { isStopping: false, messages: [...entry.state.messages, { role: "agent", content: "중단 요청에 실패했습니다. 다시 시도해 주세요." }] });
      }
    },
    move(from: string, to: string) {
      if (from === to) return;
      for (const [key, entry] of [...entries]) {
        if (key === from || key.startsWith(`${from}/`)) {
          entries.delete(key);
          entries.set(to + key.slice(from.length), entry);
        }
      }
      notify();
    },
    remove(folder: string) {
      for (const key of entries.keys()) if (key === folder || key.startsWith(`${folder}/`)) entries.delete(key);
      notify();
    },
  };
}
