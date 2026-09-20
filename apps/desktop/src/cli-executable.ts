import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CliProvider } from "./settings";

export async function findCliExecutable(provider: CliProvider) {
  const candidates = [process.env[provider === "codex" ? "CODEX_CLI_PATH" : "CLAUDE_CLI_PATH"], join(homedir(), ".local", "bin", provider), `/opt/homebrew/bin/${provider}`, `/usr/local/bin/${provider}`].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next install location. */ }
  }
  return provider;
}
