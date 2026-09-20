import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { findCliExecutable } from "./cli-executable";
import type { CliProvider } from "./settings";

export interface CliModel { id: string; name: string; description: string }
const catalogs = new Map<CliProvider, CliModel[]>();

export async function validateCliModel(provider: CliProvider, model: string) {
  const models = catalogs.get(provider) ?? await listCliModels(provider);
  if (!models.some((item) => item.id === model)) throw new Error("CLI에서 제공하는 모델을 선택해 주세요. 목록을 새로고침한 뒤 다시 시도해 주세요.");
}

export async function listCliModels(provider: CliProvider): Promise<CliModel[]> {
  const executable = await findCliExecutable(provider);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, provider === "codex" ? ["app-server"] : ["-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose"], { stdio: ["pipe", "pipe", "pipe"] });
    const lines = createInterface({ input: child.stdout });
    let settled = false;
    const models: CliModel[] = [];
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      lines.close();
      child.stdin.end();
      child.kill();
      if (error) reject(error);
      else {
        const unique = [...new Map(models.map((model) => [model.id, model])).values()];
        if (!unique.length) { reject(new Error("CLI가 모델 목록을 반환하지 않았습니다. CLI를 업데이트하고 다시 시도해 주세요.")); return; }
        catalogs.set(provider, unique);
        resolve(unique);
      }
    };
    const timeout = setTimeout(() => finish(new Error("모델 목록 조회 시간이 초과되었습니다. CLI 로그인 상태를 확인하고 다시 시도해 주세요.")), 25000);
    const send = (value: unknown) => { if (!settled) child.stdin.write(`${JSON.stringify(value)}\n`); };
    child.stdin.on("error", (error) => finish(error));
    child.stderr.on("data", () => { /* Diagnostics can include account details; do not expose them in settings. */ });
    child.on("error", () => finish(new Error(`${provider === "codex" ? "Codex" : "Claude"} CLI를 실행하지 못했습니다. 설치 상태를 확인해 주세요.`)));
    child.on("close", () => finish(new Error("모델 목록을 받기 전에 CLI가 종료되었습니다. CLI 설치와 로그인 상태를 확인해 주세요.")));
    lines.on("line", (line) => {
      if (settled) return;
      try {
        const message = JSON.parse(line);
        if (provider === "codex") {
          if (message.error) { finish(new Error("Codex 모델 목록을 조회하지 못했습니다. CLI 로그인 상태를 확인해 주세요.")); return; }
          if (message.id === 1) {
            send({ method: "initialized" });
            send({ id: 2, method: "model/list", params: { limit: 100, includeHidden: false } });
          } else if (message.id === 2) {
            if (!Array.isArray(message.result?.data)) throw new Error("Invalid model response");
            for (const item of message.result.data) {
              if (typeof item.model === "string" && !item.hidden && !(item.upgradeInfo?.retirementAt && item.upgradeInfo.retirementAt * 1000 <= Date.now())) {
                models.push({ id: item.model, name: item.displayName || item.model, description: item.description || "" });
              }
            }
            if (message.result.nextCursor) send({ id: 2, method: "model/list", params: { limit: 100, includeHidden: false, cursor: message.result.nextCursor } });
            else finish();
          }
        } else if (message.type === "control_response" && message.response?.request_id === "models") {
          if (message.response.subtype !== "success" || !Array.isArray(message.response.response?.models)) throw new Error("Invalid model response");
          for (const item of message.response.response.models) {
            // Pin resolved IDs when supplied, so the model used matches the displayed choice.
            const id = item.resolvedModel || item.value;
            if (typeof id === "string" && item.value !== "default") models.push({ id, name: item.displayName || id, description: item.description || "" });
          }
          finish();
        }
      } catch { finish(new Error("CLI 모델 응답을 읽지 못했습니다. CLI를 업데이트한 뒤 다시 시도해 주세요.")); }
    });
    send(provider === "codex"
      ? { id: 1, method: "initialize", params: { clientInfo: { name: "thinktank", version: "0.0.0" } } }
      : { type: "control_request", request_id: "models", request: { subtype: "initialize" } });
  });
}
