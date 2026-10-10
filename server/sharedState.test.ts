// End-to-end test of the shared house timeline: two players in one house
// experience the same HoH, nominations and eviction via the server.
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 3401;
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

function send(ws, msg) {
  ws.send(JSON.stringify(msg));
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
  const a = await connect();
  const b = await connect();

  a.send(JSON.stringify({ type: 'JOIN', player: { id: 'pa', nickname: 'Ada', avatar: '😎' } }));
  const wa = await waitFor(a, 'WELCOME');
  b.send(JSON.stringify({ type: 'JOIN', player: { id: 'pb', nickname: 'Bola', avatar: '🤩' } }));
  const wb = await waitFor(b, 'WELCOME');
  assert(wa.house.id === wb.house.id, 'both players in the same house');
  assert(wa.house.state.phase === 'hoh' && wa.house.state.day === 1, 'house starts Monday HoH');

  console.log('→ shared HoH (Monday)');
  send(a, { type: 'HOH_SCORE', score: 6 });
  send(b, { type: 'HOH_SCORE', score: 4 });
  const stateP = waitFor(a, 'STATE');
  send(a, { type: 'ADVANCE' });
  const st1 = await stateP;
  assert(st1.state.day === 2 && st1.state.phase === 'daily', 'advanced to Tuesday daily');
  assert(st1.state.hohId === 'pa', 'Ada (higher score) is HoH');

  console.log('→ shared nominations (Friday)');
  // advance Tue->Wed->Thu->Fri (3 advances)
  for (let i = 0; i < 3; i++) {
    const p = waitFor(a, 'STATE');
    send(a, { type: 'ADVANCE' });
    await p;
  }
  send(a, { type: 'NOMINATE', picks: ['pb', 'ai-1'] });
  send(b, { type: 'NOMINATE', picks: ['pa', 'ai-1'] });
  const p = waitFor(a, 'STATE');
  send(a, { type: 'ADVANCE' }); // Friday -> Saturday (resolves nominations)
  const stFri = await p;
  assert(stFri.state.day === 6 && stFri.state.phase === 'party', 'advanced to Saturday party');
  assert(stFri.state.nominees.length >= 2, 'nominees determined from both players');

  console.log('→ shared eviction (Sunday)');
  const p2 = waitFor(a, 'STATE');
  send(a, { type: 'ADVANCE' }); // Saturday -> Sunday
  const stSat = await p2;
  assert(stSat.state.day === 7 && stSat.state.phase === 'eviction', 'reached Sunday eviction');

  const p3 = waitFor(a, 'STATE');
  send(a, { type: 'ADVANCE' }); // Sunday -> next week (resolves eviction)
  const stSun = await p3;
  assert(stSun.state.day === 1 && stSun.state.week === 2, 'rolled into week 2');
  const evicted = stSun.state.roster.find((m) => m.status === 'evicted');
  assert(evicted !== undefined, 'someone was evicted in the shared house');

  console.log(`\n${pass} passed, ${fail} failed`);
  a.close();
  b.close();
} catch (e) {
  console.error('✗', e.message);
  fail++;
} finally {
  server.kill();
  process.exit(fail > 0 ? 1 : 0);
}
