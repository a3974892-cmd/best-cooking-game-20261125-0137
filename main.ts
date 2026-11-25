// Sizzle & Serve, handed in: a Node 22 program (standard library only) that
// copies this repository's game/ and screenshots/ into the output directory
// and writes dossier.json there with the vendored make.fun library.
//
// The grader runs it in a fresh container with /bot read-only (this repo at
// the submitted commit) and /output writable; outside the grader, the
// MAKEFUN_OUTPUT_DIR variable stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The dossier is the summary the judge reads: the game's source files, the
// vendored library, the screenshots and the totals, as buildDossier writes
// them from the output directory. Nothing here is installed or fetched.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// An entry without screenshots is no entry at all: the judge ranks by them.
// Refuse to hand in a repository that lost them, rather than writing a
// dossier that points at nothing.
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir) || !existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('screenshots/ or game/index.html is missing: nothing to hand in');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });
}

// The caps the scorer enforces: at most 4 screenshots, each at most 256 KiB;
// game/ at most 993 files and 48 MiB in all, every path at most 1000 bytes;
// the dossier's source text at most 160 KiB. An entry over any of them is
// refused, so the hand-in keeps the same limits here.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Say what was handed in, so a silent partial copy is never mistaken for a
// finished entry: the dossier's own byte count and the screenshot files.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
const shots = readdirSync(join(out, 'screenshots'));
console.log(`handed in ${shots.length} screenshot(s) and dossier.json (${dossierBytes} bytes) to ${out}`);
