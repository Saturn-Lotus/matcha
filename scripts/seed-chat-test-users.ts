import { loadEnvConfig } from '@next/env';
import bcrypt from 'bcrypt';
import type { User } from '../src/server/schemas';
import { PostgresDB, closePostgresPool } from '../src/server/db/postgres';
import { SocialRepository } from '../src/server/repositories/social-repository';
import { UserRepository } from '../src/server/repositories/user-repository';

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const PASSWORD = 'ChatSeed99Xx';

const TEST_USERS = [
  {
    username: 'alpha',
    email: 'alpha@chat.test.local',
    firstName: 'Alpha',
    lastName: 'Test',
    gender: 'male' as const,
  },
  {
    username: 'beta',
    email: 'beta@chat.test.local',
    firstName: 'Beta',
    lastName: 'Test',
    gender: 'female' as const,
  },
];

async function main() {
  const db = new PostgresDB();
  const userRepo = new UserRepository(db);
  const socialRepo = new SocialRepository(db);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users: User[] = [];

  for (const spec of TEST_USERS) {
    let user = await userRepo.findByUsername(spec.username);
    if (!user) {
      user = await userRepo.createWithProfile({
        user: {
          username: spec.username,
          email: spec.email,
          pendingEmail: spec.email,
          passwordHash,
          isVerified: true,
        },
        profile: {
          firstName: spec.firstName,
          lastName: spec.lastName,
          bio: 'Chat seed user',
          gender: spec.gender,
          sexualPreference: 'both',
          interests: ['chat'],
          pictures: null,
          avatarUrl: null,
        },
      });
      await userRepo.updateProfile(user.id, { isProfileComplete: true });
    } else {
      await userRepo.update(user.id, {
        passwordHash,
        isVerified: true,
        pendingEmail: spec.email,
      });
      await userRepo.updateProfile(user.id, { isProfileComplete: true });
    }
    users.push(user);
  }

  const [a, b] = users;
  if (a && b) {
    await socialRepo.likeUser(a.id, b.id);
    await socialRepo.likeUser(b.id, a.id);
  }

  console.log('Chat test users ready (mutual likes):');
  for (const spec of TEST_USERS) {
    console.log(`  username=${spec.username}  password=${PASSWORD}`);
  }

  await closePostgresPool();
}

main().catch(async (err) => {
  console.error(err);
  await closePostgresPool();
  process.exit(1);
});
