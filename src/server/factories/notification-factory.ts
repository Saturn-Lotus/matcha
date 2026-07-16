import { SocialRepository } from '../repositories';
import { NotificationRepository } from '../repositories/notification-repository';
import { NotificationService } from '../services/notification';
import { getPostgresDB } from './db-factory';

export const getNotificationRepository = (): NotificationRepository => {
  return new NotificationRepository(getPostgresDB());
};

export const getNotificationService = (): NotificationService => {
  return new NotificationService(
    getNotificationRepository(),
    new SocialRepository(getPostgresDB()),
  );
};
