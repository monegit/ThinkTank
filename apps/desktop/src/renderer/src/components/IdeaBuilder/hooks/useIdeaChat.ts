import { useEffect, useState, useSyncExternalStore } from "react";
import { createChatCache } from "../chatCache";
import type { SelectedElement } from "../elementPicker";

export function useIdeaChat(folder: string | null, request: (folder: string, message: string, requestId: string) => Promise<string>, selectedElement?: SelectedElement | null) {
  const [cache] = useState(createChatCache);
  useEffect(() => window.desktop.onChatProgress?.(cache.reportProgress), [cache]);
  const chat = useSyncExternalStore(cache.subscribe, () => cache.get(folder));
  return {
    ...chat,
    setInput: (input: string) => cache.setInput(folder, input),
    send: () => cache.send(folder, request, selectedElement),
    stop: () => cache.stop(folder, (requestId) => window.desktop.stopChat(requestId)),
    move: cache.move,
    remove: cache.remove,
  };
}
