import { createHmac } from 'node:crypto';
const salt = process.env.HASH_SALT || 'dev-salt';
export function hashString(input: string) {
  return createHmac('sha256', salt).update(input).digest('hex').slice(0, 32);
}
