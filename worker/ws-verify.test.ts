// Minimal, self-contained verification of the Worker + Durable Object
// WebSocket upgrade (no [assets] binding to rule out interference).
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const PORT = 8811;
const WR = 'npx';

const child = spawn(WR, ['wrangler', 'dev', '--port', String(PORT)], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
child.stdout.on('data', (d) => (out += d));
child.stderr.on('data', (d) => (out += d));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // wait for health
  let healthy = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (r.ok) { healthy = true; break; }
    } catch {}
    await sleep(500);
  }
  if (!healthy) {
    console.error('NOT HEALTHY\n' + out.slice(-2000));
    child.kill('SIGKILL');
    process.exit(1);
  }
  console.log('healthy ✓');

  const root = await (await fetch(`http://127.0.0.1:${PORT}/`)).text();
  console.log('root response prefix:', root.slice(0, 60).replace(/\n/g, ' '));

  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
  const result = await new Promise((resolve) => {
    const t = setTimeout(() => resolve('timeout'), 8000);
    ws.on('open', () => { console.log('WS OPEN ✓'); ws.send(JSON.stringify({ type: 'JOIN', player: { id: 'x' + Date.now(), nickname: 'X', avatar: '😎' } })); });
    ws.on('message', (d) => { clearTimeout(t); resolve('msg:' + d.toString().slice(0, 80)); });
    ws.on('error', (e) => { clearTimeout(t); resolve('error:' + e.message); });
  });
  console.log('WS result:', result);
  child.kill('SIGKILL');
  process.exit(result.startsWith('msg') ? 0 : 1);
}

main();
