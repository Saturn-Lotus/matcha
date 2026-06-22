import {
  AlreadyExistsException,
  HTTPError,
  NotFoundException,
  SelfActionForbiddenException,
} from '@/lib/exception-http-mapper';
import { SocialRepository, UserRepository } from '../repositories';
import { LocationRepository } from '../repositories/location-repository';
import { FameService } from './fame';
import {
  LikerEntry,
  MatchEntry,
  PaginatedResult,
  PublicProfile,
  ViewerEntry,
} from '../types';
import { ReportBody, SocialListQuery } from '../schemas';
import { yearsBetween } from '@/lib/utils';

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
  private readonly locationRepository: LocationRepository;

  constructor(
    socialRepository: SocialRepository,
    fameService: FameService,
    userRepository: UserRepository,
    locationRepository: LocationRepository,
  ) {
    this.socialRepository = socialRepository;
    this.fameService = fameService;
    this.userRepository = userRepository;
    this.locationRepository = locationRepository;
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

  likeUser = async (
    likerUserId: string,
    likedUserId: string,
  ): Promise<{ matched: boolean }> => {
    if (likerUserId === likedUserId) {
      throw new SelfActionForbiddenException('Cannot like yourself');
    }
    const likerProfile =
      await this.userRepository.findProfileByUserId(likerUserId);
    const hasPicture = (likerProfile?.pictures?.length ?? 0) > 0;
    if (!hasPicture) {
      throw new CannotLikeWithoutPictureError();
    }
    const { inserted, matched } = await this.socialRepository.likeUser(
      likerUserId,
      likedUserId,
    );
    if (!inserted) {
      throw new AlreadyExistsException('You have already liked this user');
    }
    await this.fameService.recompute(likedUserId);
    return { matched };
  };

  unlikeUser = async (likerUserId: string, likedUserId: string) => {
    const deleted = await this.socialRepository.unlikeUser(
      likerUserId,
      likedUserId,
    );
    if (!deleted) {
      throw new NotFoundException('You have not liked this user');
    }
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

  listMatches = async (
    userId: string,
    query: SocialListQuery = {},
  ): Promise<PaginatedResult<MatchEntry>> => {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const [rows, total] = await Promise.all([
      this.socialRepository.getMatches(userId, { limit: pageSize, offset }),
      this.socialRepository.getMatchesCount(userId),
    ]);
    const items: MatchEntry[] = rows.map((row) => ({
      userId: row.userId,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      avatarUrl: row.avatarUrl ?? null,
      matchedAt: row.matchedAt.toISOString(),
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

  blockUser = async (viewerId: string, targetId: string) => {
    if (viewerId === targetId) throw new SelfActionForbiddenException();
    const target = await this.userRepository.findById(targetId);
    if (!target) throw new NotFoundException('User not found');
    const inserted = await this.socialRepository.blockUser(viewerId, targetId);
    if (!inserted) {
      throw new AlreadyExistsException('You have already blocked this user');
    }
    await this.fameService.recompute(targetId);
  };

  report = async (
    reporterId: string,
    reportedId: string,
    reason: ReportBody['reason'],
  ) => {
    if (reporterId === reportedId) throw new SelfActionForbiddenException();
    const target = await this.userRepository.findById(reportedId);
    if (!target) throw new NotFoundException('User not found');
    const inserted = await this.socialRepository.report(
      reporterId,
      reportedId,
      reason,
    );
    if (!inserted) {
      throw new AlreadyExistsException('You have already reported this user');
    }
  };

  getPublicProfile = async (
    targetId: string,
    viewerId: string,
  ): Promise<PublicProfile> => {
    const isSelf = viewerId === targetId;
    if (!isSelf) {
      const blocked = await this.socialRepository.isBlockedEitherDirection(
        viewerId,
        targetId,
      );
      if (blocked) throw new NotFoundException('User not found');
    }
    const [user, profile, relation, distanceKm, targetLocation, likesCount] =
      await Promise.all([
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
        isSelf
          ? Promise.resolve(null)
          : this.locationRepository.distanceKmBetween(viewerId, targetId),
        this.locationRepository.findByUserId(targetId),
        this.socialRepository.getLikesCount(targetId),
      ]);
    if (!user || !profile) throw new NotFoundException('User not found');
    const age = profile.birthDate
      ? yearsBetween(new Date(profile.birthDate), new Date())
      : null;
    return {
      id: user.id,
      username: user.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      age,
      bio: profile.bio,
      gender: profile.gender,
      sexualPreference: profile.sexualPreference,
      avatarUrl: profile.avatarUrl,
      interests: profile.interests,
      pictures: profile.pictures,
      fameRating: profile.fameRating,
      likesCount,
      isOnline: profile.isOnline,
      lastSeenAt: profile.lastSeenAt?.toISOString() ?? null,
      distanceKm,
      city: targetLocation?.city ?? null,
      memberSince: user.createdAt?.toISOString() ?? null,
      viewerLiked: relation.viewerLiked,
      targetLiked: relation.targetLiked,
      targetViewedViewer: relation.targetViewedViewer,
      connected: relation.connected,
    };
  };
}
