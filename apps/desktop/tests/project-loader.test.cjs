const assert = require("node:assert/strict");
const { mkdtemp, mkdir, readFile, writeFile, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const loader = readFile(join(__dirname, "../src/project-loader.ts"), "utf8").then((source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
});

test("loads saved default-named ideas and distinguishes drafts from missing documents", async (t) => {
  const { loadProject } = await loader;
  const root = await mkdtemp(join(tmpdir(), "thinktank-project-loader-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of ["새 아이디어", "새 아이디어 2", "내 아이디어"]) {
    const folder = join(root, name);
    await mkdir(folder);
    await writeFile(join(folder, "index.html"), "<!doctype html><h1>Saved idea</h1>");
    await writeFile(join(folder, "README.md"), "# 생성 프롬프트\n\nSaved prompt");
    const project = await loadProject(root, name);
    assert.equal(project.isDraft, false, name);
    assert.equal(project.preview, "<!doctype html><h1>Saved idea</h1>");
    assert.equal(project.prompt, "Saved prompt");
    assert.equal(project.files.length, 2);
  }
  await mkdir(join(root, "empty"));
  assert.equal((await loadProject(root, "empty")).isDraft, true);
  await writeFile(join(root, "empty", ".DS_Store"), "metadata");
  assert.equal((await loadProject(root, "empty")).isDraft, true);
  await writeFile(join(root, "empty", "README.md"), "Draft idea");
  const draft = await loadProject(root, "empty");
  assert.equal(draft.isDraft, true);
  assert.equal(draft.prompt, "Draft idea");
  await mkdir(join(root, "no-readme"));
  await writeFile(join(root, "no-readme", "index.html"), "<h1>Preview</h1>");
  assert.deepEqual((await loadProject(root, "no-readme")).files.map((file) => file.path), ["index.html"]);
  await mkdir(join(root, "missing-index"));
  await writeFile(join(root, "missing-index", "other.txt"), "not a draft");
  await assert.rejects(loadProject(root, "missing-index"), /index.html이 없습니다/);
  await assert.rejects(loadProject(root, "does-not-exist"), { code: "ENOENT" });
  await assert.rejects(loadProject(root, "../outside"), /작업공간 밖/);
  await mkdir(join(root, "invalid-index"));
  await mkdir(join(root, "invalid-index", "index.html"));
  await assert.rejects(loadProject(root, "invalid-index"), /읽지 못했습니다/);
});
