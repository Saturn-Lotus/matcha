import {
  CreateUserProfile,
  UpdateUserProfile,
  UserProfile,
} from '@/server/schemas';
import { UserRepository } from '@/server/repositories/user-repository';
import { NotFoundException } from '@/lib/exception-http-mapper';
import { IStorage } from '@/server/storage';
import { getUserProfilePicturesPath } from '@/server/storage/utils/path';
import { ValidationError } from '@/lib/validator';

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
    const avatarIndex = profileData.pictures.findIndex(
      (pic) => pic.name === profileData.avatar,
    );
    const uploadedPictures = await this.storage.bulkUploadFiles(
      profileData.pictures,
      storagePath,
    );
    const avatarUrl =
      avatarIndex !== -1 ? uploadedPictures[avatarIndex] : uploadedPictures[0];

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

  private replacePictures = async (
    newPictures: File[] = [],
    oldPictures: string[] = [],
    userId: string,
  ): Promise<string[]> => {
    const userProfile = await this.userRepository.findProfileByUserId(userId);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const storagePath = getUserProfilePicturesPath(userProfile.userId);

    if (oldPictures.length > 0) {
      if (!userProfile.pictures || userProfile.pictures.length === 0) {
        throw new ValidationError('No pictures to remove');
      }
      for (const picUrl of oldPictures) {
        if (!userProfile.pictures.includes(picUrl)) {
          throw new ValidationError('Picture to remove not found');
        }
      }
    }

    const uploadedPictures =
      newPictures.length > 0
        ? await this.storage.bulkUploadFiles(newPictures, storagePath)
        : [];

    if (oldPictures.length > 0) {
      await Promise.all(
        oldPictures.map((picUrl) => this.storage.deleteFile(picUrl)),
      );
    }

    return uploadedPictures;
  };

  updateUserProfile = async (id: string, profileData: UpdateUserProfile) => {
    const userProfile = await this.userRepository.findProfileByUserId(id);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const uploadedPictures = await this.replacePictures(
      profileData.newPictures || [],
      profileData.picturesToRemove || [],
      id,
    );

    if (profileData.avatar) {
      const avatarInUserPictures = Boolean(
        userProfile.pictures &&
          userProfile.pictures.find((pic) => pic === profileData.avatar),
      );
      const avatarInNewUploads = Boolean(
        profileData.newPictures &&
          profileData.newPictures.find(
            (pic) => pic.name === profileData.avatar,
          ),
      );
      const avatarInRemovedPictures = Boolean(
        profileData.picturesToRemove &&
          profileData.picturesToRemove.find(
            (pic) => pic === profileData.avatar,
          ),
      );
      if (avatarInUserPictures) {
        if (avatarInRemovedPictures) {
          throw new ValidationError(
            'Avatar cannot be in the list of pictures to remove',
          );
        }
      } else if (avatarInNewUploads) {
        const uploadedAvatarIndex = profileData.newPictures!.findIndex(
          (pic) => pic.name === profileData.avatar,
        );
        if (uploadedAvatarIndex === -1) {
          throw new ValidationError('Avatar upload failed');
        }

        profileData.avatar = uploadedPictures[uploadedAvatarIndex];
      }
    }
  };
}
