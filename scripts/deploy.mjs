// Baut die App und veröffentlicht dist/ auf dem Branch gh-pages (GitHub Pages).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npm' });

sh('npm', ['run', 'build']);
const remote = execFileSync('git', ['remote', 'get-url', 'origin']).toString().trim();
const tmp = mkdtempSync(join(tmpdir(), 'fluglog-pages-'));
try {
  cpSync('dist', tmp, { recursive: true });
  sh('git', ['init', '-q', '-b', 'gh-pages'], tmp);
  sh('git', ['add', '-A'], tmp);
  sh('git', ['commit', '-q', '-m', 'Veröffentlichung'], tmp);
  sh('git', ['push', '-f', remote, 'gh-pages'], tmp);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('Veröffentlicht auf Branch gh-pages.');
