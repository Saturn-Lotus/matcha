import { CreateUserProfile } from '@/server/schemas';
import { UserRepository } from './../repositories/user-repository';
import { NotFoundException } from '@/lib/exception-http-mapper';
import { IStorage } from '../storage/base';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly storage: IStorage;

  constructor(userRepository: UserRepository, storage: IStorage) {
    this.userRepository = userRepository;
    this.storage = storage;
  }

  userExists = async (
    id?: string,
    email?: string,
    username?: string,
  ): Promise<boolean> => {
    const existingUsers = await this.userRepository.query(
      'email = $1 OR username = $2 OR id = $3',
      [email, username, id],
    );

    return existingUsers.length > 0;
  };

  createUserProfile = async (id: string, profileData: CreateUserProfile) => {
    const user = this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storagePath = `${id}/profiles/pictures/`;
    const uploadedPictures = await this.storage.bulkUploadFiles(
      profileData.pictures,
      storagePath,
    );
    const avatarUrl = uploadedPictures[0] || '';

    const profile = await this.userRepository.profileCreate({
      userId: id,
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
