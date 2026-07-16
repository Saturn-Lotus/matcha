import { SocialService } from '@/server/services/social';
import { NotFoundException } from '@/lib/exception-http-mapper';

function makeService() {
  const socialRepo = {
    likeUser: jest.fn(),
    unlikeUser: jest.fn(),
    recordView: jest.fn(),
    areMatched: jest.fn(),
    isBlockedEitherDirection: jest.fn(),
    getLikers: jest.fn(),
    getLikesCount: jest.fn(),
    getViewers: jest.fn(),
    getViewsCount: jest.fn(),
    getMatches: jest.fn(),
    getMatchesCount: jest.fn(),
    blockUser: jest.fn(),
    report: jest.fn(),
    getRelationState: jest.fn(),
  };
  const fameService = {
    recompute: jest.fn(),
  };
  const userRepo = {
    findProfileByUserId: jest.fn(),
    findById: jest.fn(),
  };
  const locationRepo = {
    findByUserId: jest.fn(),
    distanceKmBetween: jest.fn(),
  };
  const notificationService = {
    emit: jest.fn(),
  };
  const service = new SocialService(
    socialRepo as never,
    fameService as never,
    userRepo as never,
    locationRepo as never,
    notificationService as never,
  );
  return {
    service,
    socialRepo,
    fameService,
    userRepo,
    locationRepo,
    notificationService,
  };
}

describe('SocialService.likeUser — notification emissions', () => {
  it('emits "like" notification to the target', async () => {
    const { service, socialRepo, userRepo, notificationService } =
      makeService();
    userRepo.findProfileByUserId.mockResolvedValue({
      pictures: ['pic1.jpg'],
    });
    socialRepo.likeUser.mockResolvedValue({ inserted: true, matched: false });

    await service.likeUser('liker-1', 'target-1');

    expect(notificationService.emit).toHaveBeenCalledWith(
      'target-1',
      'like',
      'liker-1',
    );
  });

  it('emits "match" to both users when mutual', async () => {
    const { service, socialRepo, userRepo, notificationService } =
      makeService();
    userRepo.findProfileByUserId.mockResolvedValue({
      pictures: ['pic1.jpg'],
    });
    socialRepo.likeUser.mockResolvedValue({ inserted: true, matched: true });

    await service.likeUser('liker-1', 'target-1');

    expect(notificationService.emit).toHaveBeenCalledTimes(3);
    expect(notificationService.emit).toHaveBeenCalledWith(
      'target-1',
      'match',
      'liker-1',
    );
    expect(notificationService.emit).toHaveBeenCalledWith(
      'liker-1',
      'match',
      'target-1',
    );
  });

  it('does not emit "match" when not mutual', async () => {
    const { service, socialRepo, userRepo, notificationService } =
      makeService();
    userRepo.findProfileByUserId.mockResolvedValue({
      pictures: ['pic1.jpg'],
    });
    socialRepo.likeUser.mockResolvedValue({ inserted: true, matched: false });

    await service.likeUser('liker-1', 'target-1');

    expect(notificationService.emit).toHaveBeenCalledTimes(1);
    expect(notificationService.emit).toHaveBeenCalledWith(
      'target-1',
      'like',
      'liker-1',
    );
  });
});

describe('SocialService.unlikeUser — notification emissions', () => {
  it('emits "unmatch" when the pair was matched', async () => {
    const { service, socialRepo, notificationService } = makeService();
    socialRepo.areMatched.mockResolvedValue(true);
    socialRepo.unlikeUser.mockResolvedValue(true);

    await service.unlikeUser('liker-1', 'target-1');

    expect(notificationService.emit).toHaveBeenCalledWith(
      'target-1',
      'unmatch',
      'liker-1',
    );
  });

  it('does not emit "unmatch" when the pair was not matched', async () => {
    const { service, socialRepo, notificationService } = makeService();
    socialRepo.areMatched.mockResolvedValue(false);
    socialRepo.unlikeUser.mockResolvedValue(true);

    await service.unlikeUser('liker-1', 'target-1');

    expect(notificationService.emit).not.toHaveBeenCalled();
  });

  it('throws when no like existed (was already unliked)', async () => {
    const { service, socialRepo } = makeService();
    socialRepo.areMatched.mockResolvedValue(false);
    socialRepo.unlikeUser.mockResolvedValue(false);

    await expect(
      service.unlikeUser('liker-1', 'target-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SocialService.recordView — notification emissions', () => {
  it('emits "profile_view" to the target', async () => {
    const { service, socialRepo, notificationService } = makeService();

    await service.recordView('viewer-1', 'target-1');

    expect(notificationService.emit).toHaveBeenCalledWith(
      'target-1',
      'profile_view',
      'viewer-1',
    );
  });

  it('does not emit when viewing own profile', async () => {
    const { service, notificationService } = makeService();

    await service.recordView('user-1', 'user-1');

    expect(notificationService.emit).not.toHaveBeenCalled();
  });
});
