// Verifies the Cloudflare Worker + Durable Object game server via `wrangler dev`
// (Miniflare local simulation): house sharding, AI backfill, shared HoH.
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 8788;
const URL = `ws://127.0.0.1:${PORT}/ws`;

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

function waitFor(ws, type, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeout);
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === type) {
        ws.off('message', handler);
        clearTimeout(timer);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

async function waitHealthy() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('wrangler dev did not become healthy');
}

const child = spawn('npx', ['wrangler', 'dev', '--port', String(PORT)], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

let out = '';
child.stdout.on('data', (d) => { out += d.toString(); });
child.stderr.on('data', (d) => { out += d.toString(); });

try {
  await waitHealthy();
  console.log('✓ wrangler dev is up');

  const a = await connect();
  const b = await connect();

  a.send(JSON.stringify({ type: 'JOIN', player: { id: 'wa', nickname: 'Ada', avatar: '😎' } }));
  const wa = await waitFor(a, 'WELCOME');
  assert(wa.house.maxSize === 20, 'house max size 20');
  assert(wa.house.aiCount === 19, 'backfilled with 19 AI');
  assert(wa.house.roster.length === 20, 'roster totals 20');

  b.send(JSON.stringify({ type: 'JOIN', player: { id: 'wb', nickname: 'Bola', avatar: '🤩' } }));
  const wb = await waitFor(b, 'WELCOME');
  assert(wb.house.id === wa.house.id, 'second player same house');
  assert(wb.house.liveCount === 2, '2 live players');

  console.log('→ shared HoH via Durable Object');
  a.send(JSON.stringify({ type: 'HOH_SCORE', score: 6 }));
  b.send(JSON.stringify({ type: 'HOH_SCORE', score: 3 }));
  const p = waitFor(a, 'STATE');
  a.send(JSON.stringify({ type: 'ADVANCE' }));
  const st = await p;
  assert(st.state.day === 2 && st.state.phase === 'daily', 'advanced to Tuesday');
  assert(st.state.hohId === 'wa', 'Ada (6) crowned HoH over Bola (3)');

  console.log('→ chat relay');
  a.send(JSON.stringify({ type: 'CHAT', text: 'hello house!' }));
  const chat = await waitFor(b, 'CHAT');
  assert(chat.senderName === 'Ada', 'chat relayed');

  console.log(`\n${pass} passed, ${fail} failed`);
  a.close();
  b.close();
} catch (e) {
  console.error('✗', e.message);
  console.error(out.slice(-2000));
  fail++;
} finally {
  child.kill();
  process.exit(fail > 0 ? 1 : 0);
}
