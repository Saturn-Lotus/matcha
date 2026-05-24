import { HTTPError } from '@/lib/exception-http-mapper';
import { SocialRepository, UserRepository } from '../repositories';
import { FameService } from './fame';
import {
  LikerEntry,
  PaginatedResult,
  PublicProfile,
  ViewerEntry,
} from '../types';
import { SocialListQuery } from '../schemas';

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

@HTTPError(422)
export class CannotLikeWithoutPictureError extends Error {
  constructor(
    message = 'You need a profile picture before you can like other profiles',
  ) {
    super(message);
    this.name = 'CannotLikeWithoutPictureError';
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

  listLikers = async (
    userId: string,
    query: SocialListQuery = {},
  ): Promise<PaginatedResult<LikerEntry>> => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.socialRepository.getLikers(userId, { limit: pageSize, offset }),
      this.socialRepository.getLikesCount(userId),
    ]);
    const items: LikerEntry[] = rows.map((row) => ({
      userId: row.likerUserId,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      avatarUrl: row.avatarUrl ?? null,
      likedAt: row.likedAt.toISOString(),
    }));
    return {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  };

  likeUser = async (likerUserId: string, likedUserId: string) => {
    if (likerUserId === likedUserId) {
      throw new InvalidLikeError('Cannot like yourself');
    }
    const likerProfile =
      await this.userRepository.findProfileByUserId(likerUserId);
    const hasPicture = (likerProfile?.pictures?.length ?? 0) > 0;
    if (!hasPicture) {
      throw new CannotLikeWithoutPictureError();
    }
    await this.socialRepository.likeUser(likerUserId, likedUserId);
    await this.fameService.recompute(likedUserId);
  };

  unlikeUser = async (likerUserId: string, likedUserId: string) => {
    await this.socialRepository.unlikeUser(likerUserId, likedUserId);
    await this.fameService.recompute(likedUserId);
  };

  listViewers = async (
    userId: string,
    query: SocialListQuery = {},
  ): Promise<PaginatedResult<ViewerEntry>> => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.socialRepository.getViewers(userId, { limit: pageSize, offset }),
      this.socialRepository.getViewsCount(userId),
    ]);
    const items: ViewerEntry[] = rows.map((row) => ({
      userId: row.viewerId,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      avatarUrl: row.avatarUrl ?? null,
      viewedAt: row.viewedAt.toISOString(),
    }));
    return {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  };

  recordView = async (viewerId: string, viewedUserId: string) => {
    const skipSelfView = viewerId === viewedUserId;

    if (skipSelfView) return;

    await this.socialRepository.recordView(viewerId, viewedUserId);
    await this.fameService.recompute(viewedUserId);
  };

  getPublicProfile = async (
    targetId: string,
    viewerId: string,
  ): Promise<PublicProfile> => {
    const isSelf = viewerId === targetId;
    const [user, profile, relation] = await Promise.all([
      this.userRepository.findById(targetId),
      this.userRepository.findProfileByUserId(targetId),
      isSelf
        ? Promise.resolve({
            viewerLiked: false,
            targetLiked: false,
            targetViewedViewer: false,
            connected: false,
          })
        : this.socialRepository.getRelationState(viewerId, targetId),
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
      viewerLiked: relation.viewerLiked,
      targetLiked: relation.targetLiked,
      targetViewedViewer: relation.targetViewedViewer,
      connected: relation.connected,
    };
  };
}
