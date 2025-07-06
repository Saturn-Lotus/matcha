import { Client } from "pg";

export async function GET(request: Request) {
  const client = new Client({
    host: "localhost", // service name from docker-compose
    port: 5432,
    user: "matcha",   // default user
    password: "matcha", // default password unless changed in .env
    database: "matcha_db", // default database
  });

  await client.connect();
  const res = await client.query("SELECT NOW() as now");
  await client.end();

  return new Response(`Postgres time: ${res.rows[0].now}`);
}