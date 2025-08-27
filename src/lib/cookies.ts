import { cookies, headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { hashString } from './hash';

const COOKIE = 'rid'; // receipts device id

export function getOrSetDeviceId() {
  const c = cookies();
  let id = c.get(COOKIE)?.value;
  if (!id) {
    id = randomUUID();
    c.set(COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60*60*24*365*5 });
  }
  return id;
}

export function getDeviceHash() {
  const id = getOrSetDeviceId();
  return hashString(id);
}

export function getIpHash() {
  const h = headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  return hashString(ip);
}
