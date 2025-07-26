import { PostgresDB } from './../../server/db/postgres';
import { isUser } from '@/app/lib/validation/type-guards';
import UserRepository from '@/app/server/repositories/user-repository';

export async function POST(request: Request) {
  const body = await request.json();

  if (!isUser(body)) {
    return new Response('Invalid user data', { status: 400 });
  }
  const postgresDB = new PostgresDB();
  const userRepository = new UserRepository(postgresDB);
  try {
    const user = await userRepository.create(body);
    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response('Failed to create user', { status: 500 });
  }
}
