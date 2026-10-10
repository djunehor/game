// Integration test: spins up the real server and exercises house sharding,
// AI backfill, presence, movement and chat between two WebSocket clients.
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 3399;
const URL = `ws://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
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

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

await new Promise((r) => setTimeout(r, 3000));

try {
  const a = await connect();
  const b = await connect();

  console.log('→ house sharding + AI backfill');
  a.send(JSON.stringify({ type: 'JOIN', player: { id: 'p-1', nickname: 'Ada', avatar: '😎' } }));
  const welcomeA = await waitFor(a, 'WELCOME');
  assert(welcomeA.house.maxSize === 20, 'house max size is 20');
  assert(welcomeA.house.liveCount === 1, '1 live player after first join');
  assert(welcomeA.house.aiCount === 19, 'backfilled with 19 AI');
  assert(welcomeA.house.roster.length === 20, 'roster totals 20');

  b.send(JSON.stringify({ type: 'JOIN', player: { id: 'p-2', nickname: 'Bola', avatar: '🤩' } }));
  const welcomeB = await waitFor(b, 'WELCOME');
  assert(welcomeB.house.id === welcomeA.house.id, 'second player joins the same house');
  assert(welcomeB.house.liveCount === 2, '2 live players');
  assert(welcomeB.house.aiCount === 18, 'AI backfill shrank to 18');

  const joined = await waitFor(a, 'MEMBER_JOINED');
  assert(joined.member.nickname === 'Bola', 'first player sees the new member join');

  console.log('→ presence / movement sync');
  a.send(JSON.stringify({ type: 'MOVE', x: 10, z: 5, room: 'Kitchen' }));
  const move = await waitFor(b, 'MOVE');
  assert(move.memberId === 'p-1' && move.x === 10 && move.z === 5, 'movement broadcast to other player');
  assert(move.room === 'Kitchen', 'room change broadcast');

  console.log('→ chat relay');
  a.send(JSON.stringify({ type: 'CHAT', text: 'Who finish the plantain?!' }));
  const chat = await waitFor(b, 'CHAT');
  assert(chat.senderName === 'Ada' && chat.text.includes('plantain'), 'chat message relayed');

  console.log('→ leave / backfill on disconnect');
  b.close();
  await new Promise((r) => setTimeout(r, 300));
  // Re-join to check house has 1 live + 19 AI again
  const c = await connect();
  c.send(JSON.stringify({ type: 'JOIN', player: { id: 'p-3', nickname: 'Chidi', avatar: '🕶️' } }));
  const welcomeC = await waitFor(c, 'WELCOME');
  assert(welcomeC.house.id === welcomeA.house.id, 'rejoiner lands in the same (now-single-member) house');
  assert(welcomeC.house.liveCount === 2, 'house has 2 live after rejoin (a + c)');
  assert(welcomeC.house.aiCount === 18, 'AI backfill recalculated to 18');

  console.log(`\n${pass} passed, ${fail} failed`);
  a.close();
  c.close();
} catch (e) {
  console.error('✗', e.message);
  fail++;
} finally {
  server.kill();
  process.exit(fail > 0 ? 1 : 0);
}
