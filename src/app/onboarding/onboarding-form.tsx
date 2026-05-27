'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Upload, X, Heart } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

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

const POPULAR_INTERESTS_LOWERCASE = POPULAR_INTERESTS.map((i) =>
  i.toLowerCase(),
);

const STEPS = [1, 2, 3];

interface Step1Props {
  gender: string;
  sexualPreference: string;
  onGenderChange: (value: string) => void;
  onPreferenceChange: (value: string) => void;
  onNext: () => void;
}

function Step1({
  gender,
  sexualPreference,
  onGenderChange,
  onPreferenceChange,
  onNext,
}: Step1Props) {
  const handleNext = () => {
    if (!gender) {
      toast.error('Please select a gender');
      return;
    }
    if (!sexualPreference) {
      toast.error('Please select a preference');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="gender">Gender *</Label>
        <select
          id="gender"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
          value={gender}
          onChange={(e) => onGenderChange(e.target.value)}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="preference">I&apos;m interested in *</Label>
        <select
          id="preference"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
          value={sexualPreference}
          onChange={(e) => onPreferenceChange(e.target.value)}
        >
          <option value="">Select preference</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
          <option value="both">Everyone</option>
        </select>
      </div>

      <Button
        onClick={handleNext}
        className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
      >
        Next
      </Button>
    </div>
  );
}

interface Step2Props {
  bio: string;
  selectedInterests: string[];
  customInterest: string;
  onBioChange: (value: string) => void;
  onCustomInterestChange: (value: string) => void;
  onToggleInterest: (interest: string) => void;
  onAddCustomInterest: () => void;
  onBack: () => void;
  onNext: () => void;
}

function Step2({
  bio,
  selectedInterests,
  customInterest,
  onBioChange,
  onCustomInterestChange,
  onToggleInterest,
  onAddCustomInterest,
  onBack,
  onNext,
}: Step2Props) {
  const customInterestsList = selectedInterests.filter(
    (i) => !POPULAR_INTERESTS_LOWERCASE.includes(i),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="bio">About Me</Label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself..."
          className="border border-gray-300 rounded-md p-2 w-full"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          rows={5}
        />
      </div>

      <div>
        <Label>Interests</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {POPULAR_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => onToggleInterest(interest.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedInterests.includes(interest.toLowerCase())
                  ? 'strawberry-matcha-btn text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{interest}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Add custom interest..."
            value={customInterest}
            onChange={(e) => onCustomInterestChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddCustomInterest();
              }
            }}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onAddCustomInterest}
            className="border-gray-300"
          >
            Add
          </Button>
        </div>

        {customInterestsList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customInterestsList.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-1 px-4 py-2 strawberry-matcha-btn text-white rounded-full text-sm font-medium"
              >
                #{interest}
                <button
                  type="button"
                  onClick={() => onToggleInterest(interest)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border border-gray-300"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 strawberry-matcha-btn hover:opacity-90 text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface Step3Props {
  photos: File[];
  photoUrls: string[];
  profilePictureIndex: number;
  submitting: boolean;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onSetProfilePicture: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function Step3({
  photos,
  photoUrls,
  profilePictureIndex,
  submitting,
  onAddPhotos,
  onRemovePhoto,
  onSetProfilePicture,
  onBack,
  onSubmit,
}: Step3Props) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Upload Photos (1–5) *</Label>
        <p className="text-sm mb-4 text-gray-400">
          Upload up to 5 photos. Click on a photo to set it as your profile
          picture.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
              style={{
                borderColor:
                  index === profilePictureIndex ? '#ec4899' : 'transparent',
              }}
              onClick={() => onSetProfilePicture(index)}
            >
              <Image
                src={photoUrls[index]}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === profilePictureIndex && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-medium">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Profile
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(index);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {photos.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  onAddPhotos(files.slice(0, 5 - photos.length));
                  e.target.value = '';
                }}
              />
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Upload</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border border-gray-300"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 strawberry-matcha-btn hover:opacity-90 text-white"
        >
          {submitting ? 'Saving...' : 'Complete Profile'}
        </Button>
      </div>
    </div>
  );
}

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [gender, setGender] = useState('');
  const [sexualPreference, setSexualPreference] = useState('');
  const [bio, setBio] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [profilePictureIndex, setProfilePictureIndex] = useState(0);

  const photoUrls = useMemo(
    () => photos.map((p) => URL.createObjectURL(p)),
    [photos],
  );

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }, []);

  const addCustomInterest = useCallback(() => {
    const trimmed = customInterest.trim().toLowerCase();
    if (trimmed) {
      setSelectedInterests((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
    }
    setCustomInterest('');
  }, [customInterest]);

  const addPhotos = useCallback((files: File[]) => {
    setPhotos((prev) => [...prev, ...files]);
  }, []);

  const removePhoto = useCallback(
    (index: number) => {
      const next = photos.filter((_, i) => i !== index);
      setPhotos(next);
      if (profilePictureIndex >= next.length) {
        setProfilePictureIndex(Math.max(0, next.length - 1));
      }
    },
    [photos, profilePictureIndex],
  );

  const handleSubmit = async () => {
    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('gender', gender);
      data.append('sexualPreference', sexualPreference);
      data.append('bio', bio);
      selectedInterests.forEach((i) => data.append('interests', i));
      data.append('avatar', photos[profilePictureIndex]?.name ?? '');
      photos.forEach((photo) => data.append('pictures', photo));

      const res = await fetch(`/api/users/profiles/${userId}`, {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to save profile');
        return;
      }

      toast.success('Profile created! Welcome 🎉');
      router.push('/');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 h-full w-full strawberry-matcha-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center strawberry-matcha-gradient">
            Complete Your Profile
          </CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            {STEPS.map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'strawberry-matcha-btn' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Step1
              gender={gender}
              sexualPreference={sexualPreference}
              onGenderChange={setGender}
              onPreferenceChange={setSexualPreference}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              bio={bio}
              selectedInterests={selectedInterests}
              customInterest={customInterest}
              onBioChange={setBio}
              onCustomInterestChange={setCustomInterest}
              onToggleInterest={toggleInterest}
              onAddCustomInterest={addCustomInterest}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              photos={photos}
              photoUrls={photoUrls}
              profilePictureIndex={profilePictureIndex}
              submitting={submitting}
              onAddPhotos={addPhotos}
              onRemovePhoto={removePhoto}
              onSetProfilePicture={setProfilePictureIndex}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
