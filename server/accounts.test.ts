import { signup, login, saveProfile } from '../server/accounts';

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

const accounts = {};
const profile = { name: 'Ada Okonkwo', nickname: 'Ada', gender: 'F', age: 25, stateOfOrigin: 'Lagos', profession: 'Musician & Vibe Machine', trait: 'Strategic Schemer', avatar: '😎', accentColor: '#e63946', skinTone: '#8d5524', hairstyle: 'afro' };

console.log('→ signup');
const s1 = await signup(accounts, {}, 'Ada_Hustler', 'password123', 'ada@example.com');
assert(s1.ok === true, 'signup succeeds');
assert(typeof s1.token === 'string' && typeof s1.playerId === 'string', 'token + playerId issued');
assert(s1.profile === null, 'no profile yet after signup');

console.log('→ duplicate username');
const s2 = await signup(accounts, {}, 'ada_hustler', 'other123');
assert(s2.error === 'That username is already taken.', 'duplicate (case-insensitive) rejected');

console.log('→ weak credentials');
assert((await signup(accounts, {}, 'ab', 'password123')).error, 'short username rejected');
assert((await signup(accounts, {}, 'validuser', '123')).error, 'short password rejected');
assert((await signup(accounts, {}, 'validuser', 'password123', 'not-an-email')).error, 'bad email rejected');

console.log('→ save profile');
const saved = saveProfile(accounts, s1.token, s1.playerId, profile);
assert(saved.ok === true, 'profile saved with valid token');
assert((saveProfile(accounts, 'wrong', s1.playerId, profile)).error, 'wrong token rejected');

console.log('→ login');
const bad = await login(accounts, {}, 'ada_hustler', 'wrongpass');
assert(bad.error, 'wrong password rejected');
const ok = await login(accounts, {}, 'ada_hustler', 'password123');
assert(ok.ok === true && ok.playerId === s1.playerId, 'login succeeds and returns same playerId');
assert(ok.profile && ok.profile.nickname === 'Ada', 'login returns the saved avatar profile');
assert(ok.token !== s1.token, 'login rotates the session token');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
