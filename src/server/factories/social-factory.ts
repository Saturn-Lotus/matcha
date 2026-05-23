import { SocialRepository } from '../repositories';
import { SocialService } from '../services/social';
import { getPostgresDB } from './db-factory';
import { getFameService } from './fame-factory';
import { getUserRepository } from './user-factory';

export const getSocialRepo = (): SocialRepository => {
  return new SocialRepository(getPostgresDB());
};

export const getSocialService = (): SocialService => {
  return new SocialService(getSocialRepo(), getFameService(), getUserRepository());
};
