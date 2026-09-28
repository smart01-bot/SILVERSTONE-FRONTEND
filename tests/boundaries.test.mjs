import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const root = resolve("src");
const visited = new Set();
async function inspect(file) {
  if (visited.has(file)) return;
  visited.add(file);
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
    assert.ok(
      !match[1].startsWith("firebase/"),
      `Active Firebase import in ${file}`,
    );
    if (!match[1].startsWith(".")) continue;
    let found = false;
    for (const suffix of ["", ".js", ".jsx"]) {
      const next = resolve(dirname(file), match[1] + suffix);
      try {
        await readFile(next);
        await inspect(next);
        found = true;
        break;
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
      }
    }
    assert.ok(found, `Unresolved import ${match[1]} in ${file}`);
  }
}
test("active app graph has no Firebase calls or missing relative imports", async () => {
  await inspect(resolve("App.js"));
  assert.ok(visited.size > 30);
});
