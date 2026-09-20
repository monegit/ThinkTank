import { app } from "electron";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";

export type CliProvider = "codex" | "claude";
export type ReasoningEffort = "low" | "medium" | "high" | "xhigh" | "max";
export interface AppSettings { cliProvider: CliProvider; models: Record<CliProvider, string | null>; reasoning: Record<CliProvider, ReasoningEffort | null> }
const defaultSettings = (): AppSettings => ({ cliProvider: "codex", models: { codex: null, claude: null }, reasoning: { codex: null, claude: null } });
const validEffort = (value: unknown): value is ReasoningEffort => ["low", "medium", "high", "xhigh", "max"].includes(value as string);

export async function readSettings(): Promise<AppSettings> {
  try {
    const value = JSON.parse(await readFile(join(app.getPath("userData"), "settings.json"), "utf8"));
    return { cliProvider: value?.cliProvider === "claude" ? "claude" : "codex", models: {
      codex: typeof value?.models?.codex === "string" ? value.models.codex : null,
      claude: typeof value?.models?.claude === "string" ? value.models.claude : null,
    }, reasoning: {
      codex: validEffort(value?.reasoning?.codex) ? value.reasoning.codex : null,
      claude: validEffort(value?.reasoning?.claude) ? value.reasoning.claude : null,
    } };
  } catch (error) {
    if (error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === "ENOENT") return defaultSettings();
    throw error;
  }
}

export async function saveSettings(provider: unknown, model?: string | null, reasoning?: ReasoningEffort | null): Promise<AppSettings> {
  if (provider !== "codex" && provider !== "claude") throw new Error("지원하지 않는 CLI입니다.");
  const settings = await readSettings();
  settings.cliProvider = provider;
  if (model !== undefined) settings.models[provider] = model;
  if (reasoning !== undefined) settings.reasoning[provider] = reasoning;
  const directory = app.getPath("userData");
  await mkdir(directory, { recursive: true });
  const target = join(directory, "settings.json");
  await writeFile(`${target}.tmp`, JSON.stringify(settings, null, 2), "utf8");
  await rename(`${target}.tmp`, target);
  return settings;
}
