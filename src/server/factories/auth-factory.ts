import { Mailer } from '@/lib/mailer/Mailer';
import { getUserRepository } from './user-factory';
import { AuthService } from '../services/auth';

export const getAuthService = () => {
  const userRepository = getUserRepository();
  const mailer = new Mailer();
  return new AuthService(userRepository, mailer);
};
