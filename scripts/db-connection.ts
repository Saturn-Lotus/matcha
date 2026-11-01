import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { Client } from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(name: string, override: boolean) {
  const result = config({ path: path.join(root, name), override, quiet: true });
  if (!result.error) expand(result);
}

function databaseUrl(): string {
  loadEnvFile('.env', false);
  loadEnvFile('.env.local', true);

  const raw = process.env.DATABASE_URL ?? process.env.POSTGRES_CONNECTION_STRING;
  if (!raw) {
    throw new Error(
      'DATABASE_URL or POSTGRES_CONNECTION_STRING is not set',
    );
  }

  return raw
    .replaceAll('sslmode=enable', 'sslmode=require')
    .replaceAll('sslmode=on', 'sslmode=require');
}

export async function openDatabase(): Promise<Client> {
  const client = new Client({ connectionString: databaseUrl() });
  client.on('notice', (notice) => {
    if (notice.message) console.log(notice.message);
  });
  await client.connect();
  return client;
}
