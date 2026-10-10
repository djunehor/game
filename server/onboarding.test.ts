// Full onboarding flow over WebSocket: signup -> save avatar -> house
// assignment, then logout/login -> resume into the same house.
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 3422;
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

function waitFor(ws, type, timeout = 4000) {
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

const profile = { name: 'Ada Okonkwo', nickname: 'Ada', gender: 'F', age: 25, stateOfOrigin: 'Lagos', profession: 'Musician & Vibe Machine', trait: 'Strategic Schemer', avatar: '😎', accentColor: '#e63946', skinTone: '#8d5524', hairstyle: 'afro' };

const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 3000));

try {
  console.log('→ signup');
  const ws = await connect();
  ws.send(JSON.stringify({ type: 'SIGNUP', username: 'Ada_Hustler', password: 'password123', email: 'ada@example.com' }));
  const auth = await waitFor(ws, 'AUTH_OK');
  assert(auth.token && auth.playerId, 'signup issued token + playerId');
  assert(auth.profile === null, 'no profile after signup');

  console.log('→ save avatar profile');
  ws.send(JSON.stringify({ type: 'SAVE_PROFILE', token: auth.token, playerId: auth.playerId, profile }));
  const saved = await waitFor(ws, 'PROFILE_SAVED');
  assert(saved.profile.nickname === 'Ada', 'avatar saved to account');

  console.log('→ join a house');
  ws.send(JSON.stringify({ type: 'JOIN', player: { id: auth.playerId, nickname: 'Ada', avatar: '😎', accentColor: '#e63946', skinTone: '#8d5524', hairstyle: 'afro', profession: 'Musician & Vibe Machine', trait: 'Strategic Schemer', gender: 'F', age: 25, stateOfOrigin: 'Lagos', fanbaseClout: 12000, bbCoins: 2000 }, token: auth.token }));
  const welcome = await waitFor(ws, 'WELCOME');
  assert(welcome.selfId === auth.playerId, 'joined with account identity');
  assert(welcome.house.liveCount === 1, 'house has 1 live player');
  ws.close();
  await new Promise((r) => setTimeout(r, 300));

  console.log('→ re-login and resume');
  const ws2 = await connect();
  ws2.send(JSON.stringify({ type: 'LOGIN', username: 'Ada_Hustler', password: 'password123' }));
  const login = await waitFor(ws2, 'AUTH_OK');
  assert(login.profile && login.profile.nickname === 'Ada', 'login restores the saved avatar');
  ws2.send(JSON.stringify({ type: 'JOIN', player: { id: login.playerId, nickname: 'Ada', avatar: '😎', accentColor: '#e63946', skinTone: '#8d5524', hairstyle: 'afro', profession: 'Musician & Vibe Machine', trait: 'Strategic Schemer', gender: 'F', age: 25, stateOfOrigin: 'Lagos', fanbaseClout: 12000, bbCoins: 2000 }, token: login.token }));
  const welcome2 = await waitFor(ws2, 'WELCOME');
  assert(welcome2.house.liveCount === 1, 'resumed — still one live player (no duplicate)');

  console.log(`\n${pass} passed, ${fail} failed`);
  ws2.close();
} catch (e) {
  console.error('✗', e.message);
  fail++;
} finally {
  server.kill();
  process.exit(fail > 0 ? 1 : 0);
}
