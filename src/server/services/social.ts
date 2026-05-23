import { HTTPError } from '@/lib/exception-http-mapper';
import { SocialRepository, UserRepository } from '../repositories';
import { FameService } from './fame';
import { PublicProfile } from '../types';

@HTTPError(400)
export class InvalidLikeError extends Error {
  constructor(message = 'Invalid like action') {
    super(message);
    this.name = 'InvalidLikeError';
  }
}

@HTTPError(404)
export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class SocialService {
  private readonly socialRepository: SocialRepository;
  private readonly fameService: FameService;
  private readonly userRepository: UserRepository;

  constructor(
    socialRepository: SocialRepository,
    fameService: FameService,
    userRepository: UserRepository,
  ) {
    this.socialRepository = socialRepository;
    this.fameService = fameService;
    this.userRepository = userRepository;
  }

  listLikers = async (userId: string) => {
    return this.socialRepository.getLikers(userId);
  };

  likeUser = async (likerUserId: string, likedUserId: string) => {
    if (likerUserId === likedUserId) {
      throw new InvalidLikeError('Cannot like yourself');
    }
    await this.socialRepository.likeUser(likerUserId, likedUserId);
    await this.fameService.recompute(likedUserId);
  };

  unlikeUser = async (likerUserId: string, likedUserId: string) => {
    await this.socialRepository.unlikeUser(likerUserId, likedUserId);
    await this.fameService.recompute(likedUserId);
  };

  getViewers = async (userId: string) => {
    return this.socialRepository.getViewers(userId);
  };

  recordView = async (viewerId: string, viewedUserId: string) => {
    const skipSelfView = viewerId === viewedUserId;

    if (skipSelfView) return;

    await this.socialRepository.recordView(viewerId, viewedUserId);
    await this.fameService.recompute(viewedUserId);
  };

  getPublicProfile = async (targetId: string): Promise<PublicProfile> => {
    const [user, profile] = await Promise.all([
      this.userRepository.findById(targetId),
      this.userRepository.findProfileByUserId(targetId),
    ]);
    if (!user || !profile) throw new UserNotFoundError();
    return {
      id: user.id,
      username: user.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      gender: profile.gender,
      sexualPreference: profile.sexualPreference,
      avatarUrl: profile.avatarUrl,
      interests: profile.interests,
      pictures: profile.pictures,
      fameRating: profile.fameRating,
      isOnline: profile.isOnline,
      lastSeenAt: profile.lastSeenAt?.toISOString() ?? null,
    };
  };
}
