import { Mailer } from '@/lib/mailer/Mailer';
import { getUserRepository, getUserTokenRepository } from './user-factory';
import { AuthService } from '@/server//services/auth';

export const getAuthService = () => {
  const userRepository = getUserRepository();
  const userTokensRepository = getUserTokenRepository();
  const mailer = new Mailer();
  return new AuthService(userRepository, userTokensRepository, mailer);
};
