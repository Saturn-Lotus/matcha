import { HTTPError } from '@/lib/exception-http-mapper';
import { SocialRepository } from '../repositories';

@HTTPError(400)
export class InvalidLikeError extends Error {
  constructor(message = 'Invalid like action') {
    super(message);
    this.name = 'InvalidLikeError';
  }
}

export class SocialService {
  private readonly socialRepository: SocialRepository;

  constructor(socialRepository: SocialRepository) {
    this.socialRepository = socialRepository;
  }

  listLikers = async (userId: string) => {
    return this.socialRepository.getLikers(userId);
  };

  likeUser = async (likerUserId: string, likedUserId: string) => {
    if (likerUserId === likedUserId) {
      throw new InvalidLikeError('Cannot like yourself');
    }
    await this.socialRepository.likeUser(likerUserId, likedUserId);
  };

  unlikeUser = async (likerUserId: string, likedUserId: string) => {
    await this.socialRepository.unlikeUser(likerUserId, likedUserId);
  };
}
