import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  onChatProgress: (callback: (event: import("./cli-progress").ChatProgressEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: import("./cli-progress").ChatProgressEvent) => callback(progress);
    ipcRenderer.on("project:chat-progress", listener);
    return () => { ipcRenderer.removeListener("project:chat-progress", listener); };
  },
  apiVersion: 11,
  listCliModels: (provider: "codex" | "claude") => ipcRenderer.invoke("settings:list-models", provider),
  setCliModel: (provider: "codex" | "claude", model: string | null) => ipcRenderer.invoke("settings:set-model", provider, model),
  setCliReasoning: (provider: "codex" | "claude", effort: import("./settings").ReasoningEffort | null) => ipcRenderer.invoke("settings:set-reasoning", provider, effort),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setCliProvider: (provider: "codex" | "claude") => ipcRenderer.invoke("settings:set-provider", provider),
  platform: process.platform,
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke("project:select-folder"),
  listFolders: (folder: string): Promise<string[]> => ipcRenderer.invoke("project:list-folders", folder),
  createEmptyFolder: (root: string) => ipcRenderer.invoke("project:create-empty-folder", root),
  renameFolder: (root: string, relativeFolder: string, nextName: string) => ipcRenderer.invoke("project:rename-folder", root, relativeFolder, nextName),
  deleteFolder: (root: string, relativeFolder: string) => ipcRenderer.invoke("project:delete-folder", root, relativeFolder),
  chat: (folder: string, message: string, requestId: string) => ipcRenderer.invoke("project:chat", folder, message, requestId),
  stopChat: (requestId: string) => ipcRenderer.invoke("project:stop-chat", requestId),
  loadHtml: (root: string, relativeFolder: string) => ipcRenderer.invoke("project:load-html", root, relativeFolder),
  writeProject: (folder: string, files: Array<{ path: string; content: string }>) => ipcRenderer.invoke("project:write", folder, files),
  generateProject: (root: string, selectedFolder: string | null, title: string, prompt: string) => ipcRenderer.invoke("project:generate", root, selectedFolder, title, prompt),
});
