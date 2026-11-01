import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db-connection';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const CLEAN_SEED_USERS = `
  DELETE FROM users
  WHERE email LIKE 'seed\\_%@example.com'
     OR email = 'test@example.com'
`;

const client = await openDatabase();

try {
  if (process.argv.includes('--clean')) {
    console.log('Cleaning existing seed users...');
    await client.query(CLEAN_SEED_USERS);
    console.log('Seed users removed.');
  }

  console.log('Seeding database with 500 users...');
  const sql = readFileSync(path.join(scriptDir, 'seed_users.sql'), 'utf8');
  await client.query(sql);
} finally {
  await client.end();
}

console.log('Done.');
console.log('');
console.log('Test account ready — log in with:');
console.log('  username: testuser');
console.log('  password: Test1234world');
console.log('It has seeded matches, likers, and profile views.');
