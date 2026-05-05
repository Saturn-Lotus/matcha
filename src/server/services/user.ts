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
import type { AuthService } from '@/server/services/auth';
import { RegisterUserInput } from '@/server/types';
import bcrypt from 'bcrypt';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly storage: IStorage;
  private readonly authService?: AuthService;

  constructor(
    userRepository: UserRepository,
    storage: IStorage,
    authService?: AuthService,
  ) {
    this.userRepository = userRepository;
    this.storage = storage;
    this.authService = authService;
  }

  registerUser = async (data: RegisterUserInput) => {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepository.createWithProfile({
      user: {
        username: data.username,
        email: data.email,
        passwordHash,
        isVerified: false,
        pendingEmail: data.email,
      },
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        bio: null,
        gender: null,
        sexualPreference: null,
        avatarUrl: null,
        interests: null,
        pictures: null,
      },
    });
  };

  getUserById = async (id: string) => {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  };

  getProfileByUserId = async (userId: string): Promise<UserProfile> => {
    const profile = await this.userRepository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('User profile not found');
    }
    return profile;
  };

  getAvatarFile = async (
    userId: string,
  ): Promise<{ buffer: Buffer; contentType: string }> => {
    const profile = await this.getProfileByUserId(userId);
    if (!profile.avatarUrl) {
      throw new NotFoundException('Avatar not found');
    }
    return this.storage.getFile(profile.avatarUrl);
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

    try {
      const profile = await this.userRepository.updateProfile(user.id, {
        gender: profileData.gender,
        sexualPreference: profileData.sexualPreference,
        bio: profileData.bio,
        interests: profileData.interests,
        pictures: uploadedPictures,
        avatarUrl,
        isProfileComplete: true,
      });
      return profile;
    } catch (error) {
      // DB update failed — clean up the files we just uploaded
      await Promise.allSettled(
        uploadedPictures.map((url) => this.storage.deleteFile(url)),
      );
      throw error;
    }
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

    // Resolve avatar URL
    let avatarUrl: string | undefined;
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
        avatarUrl = profileData.avatar;
      } else if (avatarInNewUploads) {
        const uploadedAvatarIndex = profileData.newPictures!.findIndex(
          (pic) => pic.name === profileData.avatar,
        );
        if (uploadedAvatarIndex === -1) {
          throw new ValidationError('Avatar upload failed');
        }
        avatarUrl = uploadedPictures[uploadedAvatarIndex];
      }
    }

    // Build the final pictures list: keep existing minus removed, then append new uploads
    const currentPictures = userProfile.pictures || [];
    const removedSet = new Set(profileData.picturesToRemove || []);
    const remainingPictures = currentPictures.filter(
      (pic) => !removedSet.has(pic),
    );
    const finalPictures = [...remainingPictures, ...uploadedPictures];

    // Handle email change — store as pendingEmail and send a verification email
    if (profileData.email !== undefined) {
      const existingUser = await this.userRepository.findById(id);
      if (existingUser && profileData.email !== existingUser.email) {
        await this.userRepository.update(id, {
          pendingEmail: profileData.email,
        });
        // Send verification link to the new address so the user can confirm it
        if (this.authService) {
          await this.authService.sendVerificationEmail(profileData.email, id);
        }
      }
    }

    const updateData: Partial<Omit<UserProfile, 'userId'>> = {};
    if (profileData.firstName !== undefined)
      updateData.firstName = profileData.firstName;
    if (profileData.lastName !== undefined)
      updateData.lastName = profileData.lastName;
    if (profileData.gender !== undefined)
      updateData.gender = profileData.gender;
    if (profileData.sexualPreference !== undefined)
      updateData.sexualPreference = profileData.sexualPreference;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.interests !== undefined)
      updateData.interests = profileData.interests;
    if (finalPictures.length > 0) updateData.pictures = finalPictures;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    try {
      const profile = await this.userRepository.updateProfile(id, updateData);

      // Only delete old files from storage after the DB update succeeds
      if ((profileData.picturesToRemove || []).length > 0) {
        await Promise.allSettled(
          (profileData.picturesToRemove || []).map((url) =>
            this.storage.deleteFile(url),
          ),
        );
      }

      return profile;
    } catch (error) {
      // DB update failed — clean up newly uploaded files
      await Promise.allSettled(
        uploadedPictures.map((url) => this.storage.deleteFile(url)),
      );
      throw error;
    }
  };
}
