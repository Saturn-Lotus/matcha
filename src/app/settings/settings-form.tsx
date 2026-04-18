'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { UserCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/server/schemas';
import { ProfileTab, ProfileFields } from './profile-tab';
import { UserInfoTab, UserInfoFields } from './user-info-tab';
import { PicturesState } from './photo-gallery';
import { apiClient } from '@/lib/api/client';

interface SettingsFormProps {
  userId: string;
  currentEmail: string;
  profile: UserProfile;
  presignedUrls: Record<string, string>;
}

export function SettingsForm({
  userId,
  currentEmail,
  profile,
  presignedUrls,
}: SettingsFormProps) {
  const [profileFields, setProfileFields] = useState<ProfileFields>({
    gender: profile.gender || '',
    sexualPreference: profile.sexualPreference || '',
    bio: profile.bio || '',
    interests: profile.interests || [],
  });

  const [userInfoFields, setUserInfoFields] = useState<UserInfoFields>({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: currentEmail,
  });

  const [pictures, setPictures] = useState<PicturesState>({
    existing: (profile.pictures || []).map((url) => ({
      url,
      isAvatar: url === profile.avatarUrl,
    })),
    newFiles: [],
    newAvatarIndex: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = pictures.existing.length + pictures.newFiles.length;
    if (total === 0) {
      toast.error('Please keep at least one photo');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      if (userInfoFields.firstName)
        formData.append('firstName', userInfoFields.firstName);
      if (userInfoFields.lastName)
        formData.append('lastName', userInfoFields.lastName);
      if (userInfoFields.email && userInfoFields.email !== currentEmail) {
        formData.append('email', userInfoFields.email);
      }

      if (profileFields.bio) formData.append('bio', profileFields.bio);
      if (profileFields.gender) formData.append('gender', profileFields.gender);
      if (profileFields.sexualPreference)
        formData.append('sexualPreference', profileFields.sexualPreference);
      profileFields.interests.forEach((i) => formData.append('interests', i));

      const existingAvatar = pictures.existing.find((p) => p.isAvatar);
      if (existingAvatar) {
        formData.append('avatar', existingAvatar.url);
      } else if (pictures.newAvatarIndex !== null) {
        formData.append(
          'avatar',
          pictures.newFiles[pictures.newAvatarIndex].name,
        );
      }

      const originalUrls = profile.pictures || [];
      const keptUrls = new Set(pictures.existing.map((p) => p.url));
      originalUrls
        .filter((url) => !keptUrls.has(url))
        .forEach((url) => formData.append('picturesToRemove', url));
      pictures.newFiles.forEach((file) => formData.append('newPictures', file));

      await apiClient.patch(
        `/users/profiles/${userId}`,
        formData,
      );

      toast.success('Settings saved successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="userinfo" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            User Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab
            fields={profileFields}
            pictures={pictures}
            presignedUrls={presignedUrls}
            submitting={submitting}
            onFieldChange={setProfileFields}
            onPicturesChange={setPictures}
          />
        </TabsContent>

        <TabsContent value="userinfo">
          <UserInfoTab
            fields={userInfoFields}
            currentEmail={currentEmail}
            submitting={submitting}
            onChange={setUserInfoFields}
          />
        </TabsContent>
      </Tabs>
    </form>
  );
}
