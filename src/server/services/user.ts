import { CreateUserProfile } from '@/server/schemas';
import { UserRepository } from '@/server/repositories/user-repository';
import { NotFoundException } from '@/lib/exception-http-mapper';
import { IStorage } from '@/server/storage';
import { getUserProfilePicturesPath } from '@/server/storage/utils/path';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly storage: IStorage;

  constructor(userRepository: UserRepository, storage: IStorage) {
    this.userRepository = userRepository;
    this.storage = storage;
  }

  getUserById = async (id: string) => {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  };

  userExists = async (
    id?: string,
    email?: string,
    username?: string,
  ): Promise<boolean> => {
    const results = await this.userRepository.query(
      'email = $1 OR username = $2 OR id = $3 LIMIT 1;',
      [email, username, id],
    );
    return results.length > 0;
  };

  createUserProfile = async (id: string, profileData: CreateUserProfile) => {
    const user = await this.getUserById(id);

    const storagePath = getUserProfilePicturesPath(user.id);
    const uploadedPictures = await this.storage.bulkUploadFiles(
      profileData.pictures,
      storagePath,
    );
    const avatarUrl = uploadedPictures[0] || '';

    const profile = await this.userRepository.updateProfile(user.id, {
      gender: profileData.gender,
      sexualPreference: profileData.sexualPreference,
      bio: profileData.bio,
      interests: profileData.interests,
      pictures: uploadedPictures,
      avatarUrl,
    });

    return profile;
  };
}
