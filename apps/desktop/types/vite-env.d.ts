/// <reference types="vite/client" />

interface Window {
  desktop: {
    onChatProgress: (callback: (event: import("../src/cli-progress").ChatProgressEvent) => void) => () => void;
    apiVersion: number;
    listCliModels: (provider: import("../src/settings").CliProvider) => Promise<import("../src/cli-models").CliModel[]>;
    setCliModel: (provider: import("../src/settings").CliProvider, model: string | null) => Promise<import("../src/settings").AppSettings>;
    setCliReasoning: (provider: import("../src/settings").CliProvider, effort: import("../src/settings").ReasoningEffort | null) => Promise<import("../src/settings").AppSettings>;
    getSettings: () => Promise<import("../src/settings").AppSettings>;
    setCliProvider: (provider: import("../src/settings").CliProvider) => Promise<import("../src/settings").AppSettings>;
    platform: string;
    selectFolder: () => Promise<string | null>;
    listFolders: (folder: string) => Promise<string[]>;
    createEmptyFolder: (root: string) => Promise<{ folder: string; relativeFolder: string; title: string }>;
    renameFolder: (root: string, relativeFolder: string, nextName: string) => Promise<{ folder: string; relativeFolder: string; title: string }>;
    deleteFolder: (root: string, relativeFolder: string) => Promise<{ deleted: boolean }>;
    chat: (folder: string, message: string, requestId: string) => Promise<{ reply: string; preview: string | null; prompt: string; files: Array<{ path: string; content: string }> }>;
    stopChat: (requestId: string) => Promise<{ stopped: boolean }>;
    loadHtml: (root: string, relativeFolder: string) => Promise<{ folder: string; title: string; prompt: string; preview: string; files: Array<{ path: string; content: string }>; isDraft: boolean }>;
    writeProject: (folder: string, files: Array<{ path: string; content: string }>) => Promise<{ count: number }>;
    generateProject: (root: string, selectedFolder: string | null, title: string, prompt: string) => Promise<{ folder: string; relativeFolder: string; files: Array<{ path: string; content: string }>; preview: string }>;
  };
}
