import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/**
 * npm workspaces hoist styled-jsx to the monorepo root, where it resolves the
 * CMS React 18 copy. Next 15's /404 prerender then mixes React 18 (styled-jsx)
 * with React 19 (apps/web), which crashes with useContext on null.
 *
 * Nesting styled-jsx under this app's next/node_modules makes Node resolve
 * React 19 for that package without changing product code.
 */
const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(webRoot, "package.json"));
const nextDir = path.dirname(require.resolve("next/package.json"));
const targetDir = path.join(nextDir, "node_modules", "styled-jsx");

let sourceDir;
try {
  sourceDir = path.dirname(
    require.resolve("styled-jsx/package.json", {
      paths: [webRoot, path.join(webRoot, "../..")],
    }),
  );
} catch {
  console.error(
    "[ensure-styled-jsx-isolation] styled-jsx not found; run npm install first",
  );
  process.exit(1);
}

if (path.resolve(sourceDir) === path.resolve(targetDir)) {
  process.exit(0);
}

fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });
