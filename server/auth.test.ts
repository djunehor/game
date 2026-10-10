// Token auth + reconnect resume: a player presents their issued token to
// resume their house slot; a wrong token for an existing id is rejected.
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 3411;
const URL = `ws://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function waitFor(ws, type, timeout = 3000) {
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

const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 3000));

try {
  console.log('→ first join issues a token');
  const a = await connect();
  a.send(JSON.stringify({ type: 'JOIN', player: { id: 'alice', nickname: 'Alice', avatar: '😎' } }));
  const wa = await waitFor(a, 'WELCOME');
  assert(typeof wa.token === 'string' && wa.token.length > 10, 'server issued a token');
  assert(wa.house.liveCount === 1, 'Alice is the only live player');

  console.log('→ reconnect with the same token resumes the slot');
  const a2 = await connect();
  a2.send(JSON.stringify({ type: 'JOIN', player: { id: 'alice', nickname: 'Alice', avatar: '😎' }, token: wa.token }));
  const wa2 = await waitFor(a2, 'WELCOME');
  assert(wa2.house.id === wa.house.id, 'resumed into the same house');
  assert(wa2.house.liveCount === 1, 'did not create a duplicate member');
  assert(wa2.selfId === 'alice', 'same identity');

  console.log('→ wrong token for an existing id is rejected');
  const bad = await connect();
  bad.send(JSON.stringify({ type: 'JOIN', player: { id: 'alice', nickname: 'Evil', avatar: '🤖' }, token: 'wrong-token' }));
  const err = await waitFor(bad, 'AUTH_ERROR');
  assert(err.type === 'AUTH_ERROR', 'server rejected the impersonation attempt');

  console.log('→ fresh id still starts a new house/slot');
  const bob = await connect();
  bob.send(JSON.stringify({ type: 'JOIN', player: { id: 'bob', nickname: 'Bob', avatar: '🤩' } }));
  const wb = await waitFor(bob, 'WELCOME');
  assert(wb.house.liveCount === 2, 'Bob joined as a second live player');

  console.log(`\n${pass} passed, ${fail} failed`);
  a.close(); a2.close(); bad.close(); bob.close();
} catch (e) {
  console.error('✗', e.message);
  fail++;
} finally {
  server.kill();
  process.exit(fail > 0 ? 1 : 0);
}
