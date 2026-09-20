const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const cacheModule = readFile(join(__dirname, "../src/renderer/src/components/IdeaBuilder/chatCache.ts"), "utf8").then((source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
});

test("routes progress by request across rename and ignores late events", async () => {
  const cache = (await cacheModule).createChatCache();
  let requestId, finish;
  cache.setInput("A", "question");
  const pending = cache.send("A", (_folder, _message, id) => { requestId = id; return new Promise((resolve) => { finish = resolve; }); });
  cache.move("A", "renamed");
  const progress = { id: "tool", label: "명령 실행", status: "running" };
  cache.reportProgress({ requestId, progress });
  assert.deepEqual(cache.get("B").progress, []);
  assert.deepEqual(cache.get("renamed").progress, [progress]);
  cache.reportProgress({ requestId, progress: { ...progress, status: "completed" } });
  assert.equal(cache.get("renamed").progress.length, 1);
  finish("done"); await pending;
  cache.reportProgress({ requestId, progress });
  assert.equal(cache.get("renamed").progress[0].status, "completed");
});

test("cancels only the original request after an idea rename and allows continuing", async () => {
  const { createChatCache } = await cacheModule;
  const cache = createChatCache();
  let finish;
  let activeId;
  cache.setInput("/ideas/A", "question");
  const pending = cache.send("/ideas/A", (_folder, _message, requestId) => {
    activeId = requestId;
    return new Promise((resolve) => { finish = resolve; });
  });
  cache.move("/ideas/A", "/ideas/Renamed");
  await cache.stop("/ideas/B", async () => assert.fail("must not stop a different idea"));
  await cache.stop("/ideas/Renamed", async (requestId) => { assert.equal(requestId, activeId); });
  assert.equal(cache.get("/ideas/Renamed").isStopping, true);
  assert.equal(cache.get("/ideas/Renamed").isReplying, true);
  await cache.stop("/ideas/Renamed", async () => assert.fail("duplicate stop"));
  finish("대화를 중단했습니다.");
  await pending;
  assert.equal(cache.get("/ideas/Renamed").isStopping, false);
  assert.equal(cache.get("/ideas/Renamed").isReplying, false);
  cache.setInput("/ideas/Renamed", "continue");
  await cache.send("/ideas/Renamed", async () => "continued");
  assert.equal(cache.get("/ideas/Renamed").messages.length, 4);
});

test("keeps messages, drafts and pending replies scoped to their idea", async () => {
  const { createChatCache } = await cacheModule;
  const cache = createChatCache();
  let resolveA;
  const requests = [];
  cache.setInput("/ideas/A", "A question");
  const pending = cache.send("/ideas/A", (folder, message) => {
    requests.push({ folder, message });
    return new Promise((resolve) => { resolveA = resolve; });
  });
  assert.equal(cache.get("/ideas/A").isReplying, true);
  assert.deepEqual(cache.get("/ideas/B").messages, []);
  assert.equal(cache.get("/ideas/B").isReplying, false);
  cache.setInput("/ideas/A", "next A question");
  await cache.send("/ideas/A", async () => { throw new Error("duplicate request"); });
  cache.setInput("/ideas/B", "B draft");
  resolveA("A reply");
  await pending;
  assert.deepEqual(requests, [{ folder: "/ideas/A", message: "A question" }]);
  assert.deepEqual(cache.get("/ideas/A").messages.map((message) => message.content), ["A question", "A reply"]);
  assert.equal(cache.get("/ideas/A").input, "next A question");
  assert.equal(cache.get("/ideas/B").input, "B draft");
  assert.deepEqual(cache.get("/ideas/B").messages, []);
  await cache.send("/ideas/A", async (folder, message) => {
    assert.equal(folder, "/ideas/A"); assert.equal(message, "next A question"); return "A continued";
  });
  assert.equal(cache.get("/ideas/A").messages.length, 4);
  assert.equal(cache.get("/ideas/A").isReplying, false);
  assert.deepEqual(createChatCache().get("/ideas/A").messages, []);
});

test("retains in-flight conversations through rename and drops deleted ideas", async () => {
  const { createChatCache } = await cacheModule;
  const cache = createChatCache();
  let resolveReply;
  cache.setInput("/ideas/A", "question");
  const pending = cache.send("/ideas/A", () => new Promise((resolve) => { resolveReply = resolve; }));
  cache.setInput("/ideas/A/child", "child draft");
  cache.move("/ideas/A", "/ideas/Renamed");
  resolveReply("reply after rename");
  await pending;
  assert.equal(cache.get("/ideas/Renamed").messages.at(-1).content, "reply after rename");
  assert.equal(cache.get("/ideas/Renamed/child").input, "child draft");
  assert.equal(cache.get("/ideas/A").messages.length, 0);
  cache.setInput("/ideas/Renamed", "another question");
  const deletedPending = cache.send("/ideas/Renamed", () => new Promise((resolve) => { resolveReply = resolve; }));
  cache.remove("/ideas/Renamed");
  cache.setInput("/ideas/Renamed", "new idea at same path");
  resolveReply("old reply");
  await deletedPending;
  assert.equal(cache.get("/ideas/Renamed").messages.length, 0);
  assert.equal(cache.get("/ideas/Renamed").input, "new idea at same path");
  assert.equal(cache.get("/ideas/Renamed/child").input, "");
});
