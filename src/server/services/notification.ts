import type { NotificationRepository } from '../repositories/notification-repository';
import type { SocialRepository } from '../repositories/social-repository';
import type { NotificationDTO, NotificationType } from '../types';

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly socialRepository: SocialRepository,
  ) {}

  emit = async (
    userId: string,
    type: NotificationType,
    actorId: string,
    payload?: Record<string, string>,
  ): Promise<void> => {
    try {
      const blocked = await this.socialRepository.isBlockedEitherDirection(
        userId,
        actorId,
      );
      if (blocked) return;

      const muted = await this.socialRepository.isNotificationMuted(
        userId,
        actorId,
      );
      if (muted) return;

      if (type === 'profile_view') {
        const recent =
          await this.notificationRepository.findRecentViewNotification(
            actorId,
            userId,
          );
        if (recent) return;
      }

      const notification = await this.notificationRepository.create(
        userId,
        type,
        actorId,
        payload,
      );

      this.pushToSocket(userId, notification);
    } catch (error) {
      console.error('NotificationService.emit failed', error);
    }
  };

  list = async (
    userId: string,
    cursor: string | null,
    limit: number = 20,
  ): Promise<NotificationDTO[]> => {
    return this.notificationRepository.listByUser(userId, cursor, limit);
  };

  unreadCount = async (userId: string): Promise<number> => {
    return this.notificationRepository.unreadCount(userId);
  };

  markRead = async (userId: string, ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      await this.notificationRepository.markAllRead(userId);
    } else {
      await this.notificationRepository.markRead(userId, ids);
    }
  };

  private pushToSocket(userId: string, notification: NotificationDTO): void {
    const url = process.env.SOCKET_INTERNAL_URL;
    const secret = process.env.SOCKET_INTERNAL_SECRET;
    if (!url || !secret) return;
    fetch(`${url}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, userId, notification }),
    }).catch(() => {});
  }
}
