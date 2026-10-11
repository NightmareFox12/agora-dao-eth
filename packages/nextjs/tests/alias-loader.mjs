// Lets Node run the TypeScript files of the project as they are: it understands the "~~/" alias used in the code.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("~~/")) return nextResolve(specifier, context);

  const base = path.join(root, specifier.slice(3));
  const file = [`${base}.ts`, path.join(base, "index.ts")].find(candidate => existsSync(candidate));

  return nextResolve(pathToFileURL(file ?? base).href, context);
}
