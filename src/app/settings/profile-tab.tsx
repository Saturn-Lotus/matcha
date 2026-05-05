'use client';

import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { UserCircle, FileText, Upload } from 'lucide-react';
import { InterestsPicker } from './interests-picker';
import { PhotoGallery, PicturesState } from './photo-gallery';

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

export interface ProfileFields {
  gender: string;
  sexualPreference: string;
  bio: string;
  interests: string[];
}

interface ProfileTabProps {
  fields: ProfileFields;
  pictures: PicturesState;
  presignedUrls: Record<string, string>;
  submitting: boolean;
  onFieldChange: (fields: ProfileFields) => void;
  onPicturesChange: (pictures: PicturesState) => void;
}

export function ProfileTab({
  fields,
  pictures,
  presignedUrls,
  submitting,
  onFieldChange,
  onPicturesChange,
}: ProfileTabProps) {
  const set = (patch: Partial<ProfileFields>) =>
    onFieldChange({ ...fields, ...patch });

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="w-5 h-5 text-pink-500" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
              value={fields.gender}
              onChange={(e) => set({ gender: e.target.value })}
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
              value={fields.sexualPreference}
              onChange={(e) => set({ sexualPreference: e.target.value })}
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
              value={fields.bio}
              onChange={(e) => set({ bio: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <InterestsPicker
              selected={fields.interests}
              onChange={(interests) => set({ interests })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-pink-500" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery
            state={pictures}
            presignedUrls={presignedUrls}
            onChange={onPicturesChange}
          />
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
