import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  await client.connect();
  const res = await client.query('SELECT * FROM user_profiles;');
  console.log('----------> res:', res);
  await client.end();
  return new Response(`Postgres time: ${res.rows[0]}`);
}
