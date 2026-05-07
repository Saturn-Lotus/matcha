import { SocialRepository } from '../repositories/social-repository';
import { UserRepository } from '../repositories/user-repository';

const VIEW_WEIGHT = 1;
const LIKE_WEIGHT = 5;

export class FameService {
  constructor(
    private readonly socialRepository: SocialRepository,
    private readonly userRepository: UserRepository,
  ) {}

  recompute = async (userId: string): Promise<void> => {
    const [viewCount, likesCount] = await Promise.all([
      this.socialRepository.getViewsCount(userId),
      this.socialRepository.getLikesCount(userId),
    ]);

    const fameRating = Math.max(
      0,
      viewCount * VIEW_WEIGHT + likesCount * LIKE_WEIGHT,
    );

    await this.userRepository.updateProfile(userId, { fameRating });
  };
}
