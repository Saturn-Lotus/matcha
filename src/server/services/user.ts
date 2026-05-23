import {
  BrowseQuery,
  CreateUserProfile,
  UpdateUserProfile,
  UserProfile,
} from '@/server/schemas';
import { UnauthorizedException } from '@/lib/exception-http-mapper';
import { UserRepository } from '@/server/repositories/user-repository';
import { NotFoundException } from '@/lib/exception-http-mapper';
import { IStorage } from '@/server/storage';
import { getUserProfilePicturesPath } from '@/server/storage/utils/path';
import { ValidationError } from '@/lib/validator';
import type { AuthService } from '@/server/services/auth';
import {
  BrowseSuggestion,
  SuggestionsResult,
  RegisterUserInput,
  SortBy,
  SortDirection,
  UserSearchResult,
} from '@/server/types';
import { yearsBetween } from '@/lib/utils';
import bcrypt from 'bcrypt';

const MIN_REGISTRATION_AGE = 18;

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
    const birthDate = new Date(data.birthDate);
    if (isNaN(birthDate.getTime())) {
      throw new ValidationError('Invalid birth date');
    }
    if (yearsBetween(birthDate, new Date()) < MIN_REGISTRATION_AGE) {
      throw new ValidationError(
        `You must be at least ${MIN_REGISTRATION_AGE} years old to register`,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.userRepository.createWithProfile({
      user: {
        username: data.username,
        email: data.email,
        pendingEmail: null,
        passwordHash,
        isVerified: false,
      },
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate,
        bio: null,
        gender: null,
        sexualPreference: null,
        avatarUrl: null,
        interests: null,
        pictures: null,
      },
    });
  };

  setOnlineStatus = async (
    userId: string,
    isOnline: boolean,
  ): Promise<void> => {
    await this.userRepository.setOnline(userId, isOnline);
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
  ): Promise<
    | { kind: 'file'; buffer: Buffer; contentType: string }
    | { kind: 'redirect'; url: string }
  > => {
    const profile = await this.getProfileByUserId(userId);
    if (!profile.avatarUrl) {
      throw new NotFoundException('Avatar not found');
    }
    if (/^https?:\/\//i.test(profile.avatarUrl)) {
      return { kind: 'redirect', url: profile.avatarUrl };
    }
    try {
      const { buffer, contentType } = await this.storage.getFile(
        profile.avatarUrl,
      );
      return { kind: 'file', buffer, contentType };
    } catch {
      // Legacy stored pathname/key but blob is missing — treat as not-found
      // so the UI fallback (seeded avatar) kicks in instead of a 500.
      throw new NotFoundException('Avatar not found');
    }
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

    let emailChanged = false;
    if (profileData.email !== undefined) {
      const existingUser = await this.userRepository.findById(id);
      if (existingUser && profileData.email !== existingUser.email) {
        await this.userRepository.update(id, {
          pendingEmail: profileData.email,
          isVerified: false,
        });
        if (this.authService) {
          await this.authService.sendVerificationEmail(profileData.email, id);
        }
        emailChanged = true;
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

      return { profile, emailChanged };
    } catch (error) {
      // DB update failed — clean up newly uploaded files
      await Promise.allSettled(
        uploadedPictures.map((url) => this.storage.deleteFile(url)),
      );
      throw error;
    }
  };

  searchUsers = async (
    viewerId: string,
    query: string,
    limit: number,
  ): Promise<UserSearchResult[]> => {
    return this.userRepository.search(query, limit, viewerId);
  };

  changePassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const user = await this.getUserById(userId);
    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash });
  };

  resolveOrientation = (
    sexualPreference: UserProfile['sexualPreference'],
  ): readonly ('male' | 'female')[] => {
    if (sexualPreference === 'male') return ['male'];
    if (sexualPreference === 'female') return ['female'];
    return ['male', 'female'];
  };

  getUsersWithProfiles = async (
    viewerId: string,
    filters: BrowseQuery = {},
  ): Promise<SuggestionsResult> => {
    const viewer = await this.getProfileByUserId(viewerId);
    if (!viewer.gender) {
      throw new NotFoundException('Viewer gender is not set');
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const sortBy: SortBy = filters.sortBy ?? 'relevance';
    const sortDirection: SortDirection =
      filters.sortDirection ??
      (sortBy === 'sharedTagCount' || sortBy === 'fameRating' ? 'desc' : 'asc');

    const needsLocation =
      filters.maxDistanceKm !== undefined || sortBy === 'distance';
    if (needsLocation) {
      const viewerHasLocation =
        await this.userRepository.userHasLocation(viewerId);
      if (!viewerHasLocation) {
        throw new ValidationError(
          'Set your location before filtering or sorting by distance',
        );
      }
    }

    const allowedGenders = this.resolveOrientation(viewer.sexualPreference);
    const { rows, total } = await this.userRepository.getUsersWithProfiles({
      viewerId,
      viewerGender: viewer.gender,
      allowedGenders,
      page,
      pageSize,
      interests: filters.interests ?? null,
      maxDistanceKm: filters.maxDistanceKm ?? null,
      minFameRating: filters.minFameRating ?? null,
      maxFameRating: filters.maxFameRating ?? null,
      age: filters.age ?? null,
      sortBy,
      sortDirection,
    });

    const items: BrowseSuggestion[] = rows.map((row) => ({
      id: row.id,
      username: row.username,
      firstName: row.firstName,
      age: row.age,
      distanceKm: row.distanceKm,
      fameRating: row.fameRating,
      sharedTagCount: row.sharedTagCount,
      previewPictureUrl: row.avatarUrl,
      photos: row.pictures ?? [],
      isOnline: row.isOnline,
      lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
      bio: row.bio,
      tags: row.interests ?? [],
      viewerLiked: row.viewerLiked,
      targetLiked: row.targetLiked,
      targetViewedViewer: row.targetViewedViewer,
      connected: row.viewerLiked && row.targetLiked,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  };
}
