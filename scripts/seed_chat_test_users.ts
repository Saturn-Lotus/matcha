import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db-connection';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const client = await openDatabase();

try {
  console.log('Seeding two matched chat test users...');
  const sql = readFileSync(
    path.join(scriptDir, 'seed_chat_test_users.sql'),
    'utf8',
  );
  await client.query(sql);
} finally {
  await client.end();
}

console.log('');
console.log('Done. Two matched users created — log in (in two browsers/profiles) with:');
console.log('');
console.log('  User A');
console.log('    username: chat_alice');
console.log('    password: Matcha2024pwd');
console.log('');
console.log('  User B');
console.log('    username: chat_bob');
console.log('    password: Latte2024pwd');
console.log('');
console.log('They are already matched, so open /matches and hit "Message" to start chatting.');
