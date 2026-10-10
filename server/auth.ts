// Password hashing via scrypt (OWASP-recommended KDF), using Node's native
// `node:crypto` scrypt. Works in Node and in Cloudflare Workers via the
// `nodejs_compat` compatibility flag. Cloudflare's Web Crypto PBKDF2 caps at
// 100,000 iterations, which is why we use scrypt here instead.

import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options?: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

// N=2^15 (32 MiB memory) — comfortably within Workers' 128 MiB limit, and
// cryptographically strong (much stronger than PBKDF2 at the 100k runtime cap).
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export function randomSalt(): string {
  return randomBytes(16).toString('hex');
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = (await scrypt(password, Buffer.from(saltHex, 'hex'), KEYLEN, SCRYPT_PARAMS)) as Buffer;
  return key.toString('hex');
}

export async function verifyPassword(password: string, saltHex: string, expectedHex: string): Promise<boolean> {
  const key = (await scrypt(password, Buffer.from(saltHex, 'hex'), KEYLEN, SCRYPT_PARAMS)) as Buffer;
  const expected = Buffer.from(expectedHex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function validateUsername(u: unknown): u is string {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(u);
}

export function validatePassword(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 6;
}

export function validateEmail(e: unknown): boolean {
  if (!e) return true; // optional
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
