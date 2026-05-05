'use client';

import { useState } from 'react';
import { MapPin, UserCircle, User, Images } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/server/schemas';
import { PhotoGallery, PicturesState } from './photo-gallery';
import { LocationTab, LocationState } from './location-tab';
import { InterestsPicker } from './interests-picker';
import { apiClient } from '@/lib/api/client';

interface SettingsFormProps {
  userId: string;
  currentEmail: string;
  profile: UserProfile;
  presignedUrls: Record<string, string>;
}

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const SEXUAL_PREFERENCES = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'both', label: 'Both' },
];

export function SettingsForm({
  userId,
  currentEmail,
  profile,
  presignedUrls,
}: SettingsFormProps) {
  const [gender, setGender] = useState(profile.gender || '');
  const [sexualPreference, setSexualPreference] = useState(profile.sexualPreference || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [interests, setInterests] = useState<string[]>(profile.interests || []);
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [email, setEmail] = useState(currentEmail);

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: '',
    neighborhood: '',
    locationType: 'manual',
    consentGiven: false,
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

      if (firstName) formData.append('firstName', firstName);
      if (lastName) formData.append('lastName', lastName);
      if (email && email !== currentEmail) formData.append('email', email);
      if (bio) formData.append('bio', bio);
      if (gender) formData.append('gender', gender);
      if (sexualPreference) formData.append('sexualPreference', sexualPreference);
      interests.forEach((i) => formData.append('interests', i));

      const existingAvatar = pictures.existing.find((p) => p.isAvatar);
      if (existingAvatar) {
        formData.append('avatar', existingAvatar.url);
      } else if (pictures.newAvatarIndex !== null) {
        formData.append('avatar', pictures.newFiles[pictures.newAvatarIndex].name);
      }

      const originalUrls = profile.pictures || [];
      const keptUrls = new Set(pictures.existing.map((p) => p.url));
      originalUrls
        .filter((url) => !keptUrls.has(url))
        .forEach((url) => formData.append('picturesToRemove', url));
      pictures.newFiles.forEach((file) => formData.append('newPictures', file));

      await apiClient.patch(`/users/profiles/${userId}`, formData);

      if (location.consentGiven) {
        if (location.latitude === null || location.longitude === null) {
          toast.error('Please set your location before saving');
          return;
        }
        if (location.locationType === 'manual' && !location.city) {
          toast.error('Please enter at least your city');
          return;
        }
        await apiClient.patch('/users/location', {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city || null,
          neighborhood: location.neighborhood || null,
          locationType: location.locationType,
          consentGiven: location.consentGiven,
        });
      }

      toast.success('Settings saved successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full h-14 bg-[#F9F1E7] border border-transparent focus:border-emerald-400 rounded-xl px-4 focus:ring-0 outline-none text-base transition-colors appearance-none';
  const labelCls = 'block text-xs font-semibold text-zinc-500 px-1 mb-1.5';
  const sectionCls =
    'rounded-[2.5rem] p-8 backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_40px_rgba(255,141,161,0.08)]';

  const navItems = [
    { id: 'profile', icon: <UserCircle className="w-4 h-4" />, label: 'Profile Details' },
    { id: 'pictures', icon: <Images className="w-4 h-4" />, label: 'Pictures' },
    { id: 'account', icon: <User className="w-4 h-4" />, label: 'Account' },
    { id: 'location', icon: <MapPin className="w-4 h-4" />, label: 'Location' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto px-5 py-10">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-52 shrink-0">
          <div className="sticky top-24 rounded-[2rem] p-2 backdrop-blur-xl bg-white/70 border border-white/40 shadow-[0_8px_30px_rgba(255,141,161,0.08)]">
            <nav className="flex flex-col gap-1">
              {navItems.map(({ id, icon, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-rose-50 hover:text-rose-500 transition-all text-sm font-medium"
                >
                  {icon}
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          <section id="profile" className={sectionCls}>
            <h2 className="text-2xl font-bold text-rose-500 mb-1">Profile Details</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Share a little more about yourself to find your perfect blend.
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    className={inputCls}
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
                <div>
                  <label className={labelCls}>Interested In</label>
                  <select
                    className={inputCls}
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
              </div>
              <div>
                <label className={labelCls}>Bio</label>
                <textarea
                  className="w-full bg-[#F9F1E7] border border-transparent focus:border-emerald-400 rounded-xl p-4 focus:ring-0 outline-none text-base resize-none transition-colors"
                  placeholder="A cozy morning for me looks like..."
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Interests</label>
                <InterestsPicker selected={interests} onChange={setInterests} />
              </div>
            </div>
          </section>

          <section id="pictures" className={sectionCls}>
            <h2 className="text-2xl font-bold text-rose-500 mb-1">Manage Pictures</h2>
            <p className="text-zinc-500 text-sm mb-6">
              The first picture is your primary profile photo.
            </p>
            <PhotoGallery state={pictures} presignedUrls={presignedUrls} onChange={setPictures} />
          </section>

          <section id="account" className={sectionCls}>
            <h2 className="text-2xl font-bold text-rose-500 mb-1">Account Settings</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Keep your contact information up to date.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {email !== currentEmail && (
                  <p className="text-xs text-amber-600 mt-1.5 px-1">
                    A verification link will be sent to confirm the new address.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section id="location" className={sectionCls}>
            <h2 className="text-2xl font-bold text-rose-500 mb-1">Location</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Manage how you connect with people nearby.
            </p>
            <LocationTab userId={userId} location={location} onChange={setLocation} />
          </section>

          <div className="flex justify-end pb-10">
            <button
              type="submit"
              disabled={submitting}
              className="strawberry-matcha-btn text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
