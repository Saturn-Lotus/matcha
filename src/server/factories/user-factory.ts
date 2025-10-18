import { PostgresDB } from '../db/postgres';
import { UserRepository } from '../repositories';
import { UserService } from '../services/user';
import { IStorage } from '../storage/base';
import { getStorage } from './storage-factory';

export const getUserRepository = (db?: PostgresDB) => {
  if (!db) {
    db = new PostgresDB();
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
  return new UserService(userRepository, storage);
};
