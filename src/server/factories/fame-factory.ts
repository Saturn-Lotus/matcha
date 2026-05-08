import { FameService } from '../services/fame';
import { getSocialRepo } from './social-factory';
import { getUserRepository } from './user-factory';

export const getFameService = (): FameService =>
  new FameService(getSocialRepo(), getUserRepository());
