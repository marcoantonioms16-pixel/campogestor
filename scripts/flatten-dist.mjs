/**
 * Garante que a pasta dist/ na raiz contenha os arquivos estáticos finais
 * (HTML, JS, CSS, assets) prontos para o Netlify (publish = "dist").
 *
 * TanStack Start / Nitro costuma emitir o client em dist/client — este script
 * move esse conteúdo para a raiz de dist/.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const client = join(dist, "client");

function list(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

if (!existsSync(dist)) {
  console.error("[flatten-dist] Pasta dist/ não encontrada após o build.");
  process.exit(1);
}

if (existsSync(client) && statSync(client).isDirectory()) {
  const tmp = join(root, ".dist-flatten-tmp");
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  // Copia client → tmp
  for (const name of list(client)) {
    cpSync(join(client, name), join(tmp, name), { recursive: true });
  }

  // Limpa dist inteiro
  for (const name of list(dist)) {
    rmSync(join(dist, name), { recursive: true, force: true });
  }

  // tmp → dist (raiz)
  for (const name of list(tmp)) {
    cpSync(join(tmp, name), join(dist, name), { recursive: true });
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log("[flatten-dist] dist/client → dist/ (ok)");
} else {
  console.log("[flatten-dist] dist/ já está plano (sem subpasta client)");
}

const files = list(dist);
if (files.length === 0) {
  console.error("[flatten-dist] dist/ está vazia após o flatten.");
  process.exit(1);
}

const hasIndex =
  existsSync(join(dist, "index.html")) ||
  files.some((f) => f.endsWith(".html"));

console.log(
  `[flatten-dist] ${files.length} itens em dist/` +
    (hasIndex ? " (index.html presente)" : " (sem index.html — verifique o build)"),
);
