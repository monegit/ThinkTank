export interface CliProgress { id: string; label: string; status: "running" | "completed" | "failed" }
export interface ChatProgressEvent { requestId: string; progress: CliProgress }

/** Extracts observable actions only; never forwards reasoning, commands, file paths or tool output. */
export function createProgressParser() {
  const actions = new Map<string, string>();
  const toolLabel = (name: string) => ({ Read: "파일 내용 확인", Glob: "파일 검색", Grep: "내용 검색", Bash: "명령 실행", Edit: "내용 수정", Write: "내용 작성", WebSearch: "자료 검색", WebFetch: "자료 확인", Agent: "하위 작업 실행", Task: "하위 작업 실행" }[name] ?? "도구 실행");
  return (event: any): CliProgress[] => {
    if (!event || typeof event !== "object") return [];
    if (event.type === "thread.started" || (event.type === "system" && event.subtype === "init")) return [{ id: "connection", label: "CLI 연결", status: "completed" }];
    if (event.type === "item.started" || event.type === "item.updated" || event.type === "item.completed") {
      const item = event.item;
      if (!item || typeof item.id !== "string") return [];
      const label = ({ command_execution: "명령 실행", file_change: "내용 수정", web_search: "자료 검색", mcp_tool_call: "도구 실행" } as Record<string, string>)[item.type];
      if (!label) return [];
      return [{ id: item.id, label, status: item.status === "failed" || (typeof item.exit_code === "number" && item.exit_code !== 0) ? "failed" : event.type === "item.completed" ? "completed" : "running" }];
    }
    if (event.type === "assistant" && Array.isArray(event.message?.content)) {
      return event.message.content.filter((item: any) => item.type === "tool_use" && typeof item.id === "string").map((item: any) => {
        const label = toolLabel(item.name);
        actions.set(item.id, label);
        return { id: item.id, label, status: "running" as const };
      });
    }
    if (event.type === "user" && Array.isArray(event.message?.content)) {
      return event.message.content.filter((item: any) => item.type === "tool_result" && actions.has(item.tool_use_id)).map((item: any) => ({ id: item.tool_use_id, label: actions.get(item.tool_use_id)!, status: item.is_error ? "failed" : "completed" }));
    }
    return [];
  };
}
