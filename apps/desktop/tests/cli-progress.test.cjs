const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const parserModule = readFile(join(__dirname, "../src/cli-progress.ts"), "utf8").then((source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
});
test("Codex reports observable actions without exposing reasoning or command contents", async () => {
  const parse = (await parserModule).createProgressParser();
  assert.deepEqual(parse({ type: "item.completed", item: { id: "r", type: "reasoning", text: "private" } }), []);
  assert.deepEqual(parse({ type: "item.started", item: { id: "1", type: "command_execution", command: "secret" } }), [{ id: "1", label: "명령 실행", status: "running" }]);
  assert.equal(parse({ type: "item.completed", item: { id: "1", type: "command_execution", exit_code: 1 } })[0].status, "failed");
});
test("Claude matches tool results to their original observable actions", async () => {
  const parse = (await parserModule).createProgressParser();
  assert.deepEqual(parse({ type: "assistant", message: { content: [{ type: "thinking", thinking: "private" }, { type: "tool_use", id: "a", name: "Read", input: { file_path: "secret" } }] } }), [{ id: "a", label: "파일 내용 확인", status: "running" }]);
  assert.deepEqual(parse({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "a", content: "private" }] } }), [{ id: "a", label: "파일 내용 확인", status: "completed" }]);
});
