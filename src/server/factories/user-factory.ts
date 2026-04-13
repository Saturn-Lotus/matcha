import { PostgresDB } from '@/server/db/postgres';
import { UserRepository, UserTokensRepository } from '@/server/repositories';
import { UserService } from '@/server/services/user';
import { IStorage } from '@/server/storage/base';
import { getStorage } from './storage-factory';
import { getAuthService } from './auth-factory';

const getPostgresDB = (): PostgresDB => {
  return new PostgresDB();
};

export const getUserRepository = (db?: PostgresDB) => {
  if (!db) {
    db = getPostgresDB();
  }
  return new UserRepository(db);
};

export const getUserService = async (
  userRepository?: UserRepository,
  storage?: IStorage,
) => {
  if (!userRepository) {
    userRepository = getUserRepository();
  }
  if (!storage) {
    storage = await getStorage();
  }
  const authService = getAuthService();
  return new UserService(userRepository, storage, authService);
};

export const getUserTokenRepository = (db?: PostgresDB) => {
  if (!db) {
    db = getPostgresDB();
  }
  return new UserTokensRepository(db);
};
