'use client';

import { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Upload, X, Heart, User, Mail, FileText, Info } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { UserProfile } from '@/server/schemas';

const POPULAR_INTERESTS = [
  'Travel',
  'Photography',
  'Hiking',
  'Coffee',
  'Dogs',
  'Music',
  'Fitness',
  'Reading',
  'Cooking',
  'Art',
  'Gaming',
  'Yoga',
  'Vegan',
  'Geek',
  'Piercing',
  'Tattoos',
  'Dancing',
  'Movies',
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const SEXUAL_PREFERENCES = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
];

type ExistingPicture = { url: string; isAvatar: boolean };

interface EditProfileFormProps {
  userId: string;
  currentEmail: string;
  profile: UserProfile;
  presignedUrls: Record<string, string>;
}

export function EditProfileForm({ userId, currentEmail, profile, presignedUrls }: EditProfileFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [email, setEmail] = useState(currentEmail || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [sexualPreference, setSexualPreference] = useState(
    profile.sexualPreference || '',
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests || [],
  );
  const [customInterest, setCustomInterest] = useState('');

  // Existing pictures from server (track which to keep/remove)
  const [existingPictures, setExistingPictures] = useState<ExistingPicture[]>(
    (profile.pictures || []).map((url) => ({
      url,
      isAvatar: url === profile.avatarUrl,
    })),
  );

  // New pictures to upload
  const [newPictures, setNewPictures] = useState<File[]>([]);
  const [newPictureAvatarIndex, setNewPictureAvatarIndex] = useState<
    number | null
  >(null);

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPictures = existingPictures.length + newPictures.length;
  const avatarUrl =
    existingPictures.find((p) => p.isAvatar)?.url ||
    (newPictureAvatarIndex !== null
      ? newPictures[newPictureAvatarIndex]?.name
      : null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim().toLowerCase();
    if (trimmed && !selectedInterests.includes(trimmed)) {
      setSelectedInterests((prev) => [...prev, trimmed]);
    }
    setCustomInterest('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - totalPictures;
    const toAdd = files.slice(0, remaining);
    setNewPictures((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeExistingPicture = (url: string) => {
    setExistingPictures((prev) => {
      const next = prev.filter((p) => p.url !== url);
      // If the removed picture was the avatar, assign the first remaining as avatar
      const wasAvatar = prev.find((p) => p.url === url)?.isAvatar;
      if (wasAvatar && next.length > 0) {
        next[0].isAvatar = true;
      }
      return next;
    });
  };

  const removeNewPicture = (index: number) => {
    setNewPictures((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (newPictureAvatarIndex === index) {
        setNewPictureAvatarIndex(null);
      } else if (
        newPictureAvatarIndex !== null &&
        newPictureAvatarIndex > index
      ) {
        setNewPictureAvatarIndex(newPictureAvatarIndex - 1);
      }
      return next;
    });
  };

  const setExistingAsAvatar = (url: string) => {
    setExistingPictures((prev) =>
      prev.map((p) => ({ ...p, isAvatar: p.url === url })),
    );
    setNewPictureAvatarIndex(null);
  };

  const setNewAsAvatar = (index: number) => {
    setExistingPictures((prev) => prev.map((p) => ({ ...p, isAvatar: false })));
    setNewPictureAvatarIndex(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPictures === 0) {
      toast.error('Please keep at least one photo');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (firstName) formData.append('firstName', firstName);
      if (lastName) formData.append('lastName', lastName);
      if (email && email !== currentEmail) formData.append('email', email);
      if (bio) formData.append('bio', bio);
      if (gender) formData.append('gender', gender);
      if (sexualPreference) formData.append('sexualPreference', sexualPreference);
      selectedInterests.forEach((i) => formData.append('interests', i));

      // Determine the avatar value to send
      const existingAvatar = existingPictures.find((p) => p.isAvatar);
      if (existingAvatar) {
        formData.append('avatar', existingAvatar.url);
      } else if (newPictureAvatarIndex !== null) {
        formData.append('avatar', newPictures[newPictureAvatarIndex].name);
      }

      // Pictures to remove = original pictures minus the ones still in existingPictures
      const originalUrls = profile.pictures || [];
      const keptUrls = new Set(existingPictures.map((p) => p.url));
      const toRemove = originalUrls.filter((url) => !keptUrls.has(url));
      toRemove.forEach((url) => formData.append('picturesToRemove', url));

      newPictures.forEach((file) => formData.append('newPictures', file));

      const res = await fetch(`/api/users/profiles/${userId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Update failed');
      }

      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal info */}
      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-pink-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="w-4 h-4 text-pink-400" />
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            {email !== currentEmail && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" />
                A verification link will be sent to confirm the new address.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="preference">Interested in</Label>
            <select
              id="preference"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
              value={sexualPreference}
              onChange={(e) => setSexualPreference(e.target.value)}
            >
              <option value="">Select preference</option>
              {SEXUAL_PREFERENCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-pink-500" />
            About Me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself..."
              className="border border-gray-300 rounded-md p-2 w-full resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedInterests.includes(interest.toLowerCase())
                      ? 'strawberry-matcha-btn text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{interest}
                </button>
              ))}
            </div>

            {selectedInterests.filter(
              (i) => !POPULAR_INTERESTS.map((p) => p.toLowerCase()).includes(i),
            ).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedInterests
                  .filter(
                    (i) =>
                      !POPULAR_INTERESTS.map((p) =>
                        p.toLowerCase(),
                      ).includes(i),
                  )
                  .map((interest) => (
                    <span
                      key={interest}
                      className="flex items-center gap-1 px-3 py-1.5 strawberry-matcha-btn text-white rounded-full text-sm font-medium"
                    >
                      #{interest}
                      <button
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add custom interest..."
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomInterest();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomInterest}
                className="border-gray-300"
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-pink-500" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Click a photo to set it as your profile picture. You can have up to
            5 photos.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            {existingPictures.map((pic) => (
              <div
                key={pic.url}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
                style={{
                  borderColor: pic.isAvatar ? '#ec4899' : 'transparent',
                }}
                onClick={() => setExistingAsAvatar(pic.url)}
              >
                <Image
                  src={presignedUrls[pic.url] ?? pic.url}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                />
                {pic.isAvatar && (
                  <div className="absolute top-1 left-1 bg-pink-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                    <Heart className="w-3 h-3 inline mr-0.5" />
                    Profile
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExistingPicture(pic.url);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {newPictures.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
                style={{
                  borderColor:
                    newPictureAvatarIndex === index &&
                    !existingPictures.find((p) => p.isAvatar)
                      ? '#ec4899'
                      : 'transparent',
                }}
                onClick={() => setNewAsAvatar(index)}
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`New photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {newPictureAvatarIndex === index &&
                  !existingPictures.find((p) => p.isAvatar) && (
                    <div className="absolute top-1 left-1 bg-pink-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                      <Heart className="w-3 h-3 inline mr-0.5" />
                      Profile
                    </div>
                  )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNewPicture(index);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {totalPictures < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-7 h-7 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Upload</span>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
