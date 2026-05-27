'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Calendar,
  Clock,
  Heart,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatDistanceKm,
  formatGenderLabel,
  formatMonthYear,
  formatOrientationLabel,
  formatPreferenceLabel,
  relativeTime,
} from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { pickRelationVariant } from '@/app/components/ui/relation-badge';
import { apiClient } from '@/lib/api';
import type { PublicProfile } from '@/server/types';
import { ProfileSubnav } from './components/profile-subnav';
import { ProfileCard } from './components/profile-card';
import { ProfileHeroPhoto } from './components/profile-hero-photo';
import { ProfileActionRow } from './components/profile-action-row';
import { ProfileSection, ProfileDivider } from './components/profile-section';
import { ProfileInterestTags } from './components/profile-interest-tags';
import { ProfileDetailGrid } from './components/profile-detail-grid';

type ReportReason = 'fake_account' | 'spam' | 'harassment';

interface ProfileViewProps {
  id: string;
  viewerHasAvatar: boolean;
}

export function ProfileView({ id, viewerHasAvatar }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] =
    useState<ReportReason>('fake_account');

  useEffect(() => {
    apiClient
      .get<PublicProfile>(`/users/${id}`)
      .then((p) => {
        setProfile(p);
        setIsLiked(p.viewerLiked);
      })
      .catch(() => setNotFound(true));
    apiClient.post(`/users/${id}/views`);
  }, [id]);

  const likeDisabled = !viewerHasAvatar && !isLiked;

  const toggleLike = async () => {
    if (likeDisabled) {
      toast.info('Add a profile picture to like other profiles', {
        description: 'Head to your profile to upload one.',
      });
      return;
    }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    try {
      if (wasLiked) {
        await apiClient.delete(`/users/${id}/likes`);
      } else {
        await apiClient.post(`/users/${id}/likes`);
      }
    } catch {
      setIsLiked(wasLiked);
    }
  };

  const confirmReport = async () => {
    if (reporting) return;
    setReporting(true);
    try {
      await apiClient.post(`/users/${id}/report`, { reason: reportReason });
      toast.success('Report submitted', {
        description: 'Thanks for helping keep the community safe.',
      });
      setShowReportConfirm(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not submit report';
      toast.error(message);
      setShowReportConfirm(false);
    } finally {
      setReporting(false);
    }
  };

  const confirmBlock = async () => {
    if (blocking) return;
    setBlocking(true);
    try {
      await apiClient.post(`/users/${id}/block`);
      toast.success(
        profile?.username ? `You blocked @${profile.username}` : 'User blocked',
      );
      router.replace('/browse');
    } catch {
      toast.error('Could not block user. Please try again.');
      setBlocking(false);
      setShowBlockConfirm(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
        <UserIcon className="w-14 h-14 text-muted-foreground" />
        <p className="text-lg font-semibold">User not found</p>
        <p className="text-sm text-muted-foreground">
          This profile doesn&apos;t exist or may have been removed.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col">
        <div className="mx-auto w-full max-w-[560px] px-4 pt-4 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/50 animate-pulse" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-4 w-40 rounded bg-white/50 animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/40 animate-pulse" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[560px] px-4 pb-10">
          <div className="bg-white rounded-[28px] overflow-hidden shadow-sm">
            <div className="aspect-[4/5] bg-muted animate-pulse" />
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-center gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-muted animate-pulse"
                  />
                ))}
              </div>
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const photos = profile.pictures ?? [];
  const heroPhotos =
    photos.length > 0 ? photos : profile.avatarUrl ? [profile.avatarUrl] : [];

  const genderLabel = formatGenderLabel(profile.gender);
  const orientationLabel = formatOrientationLabel(
    profile.gender,
    profile.sexualPreference,
  );
  const preferenceLabel = formatPreferenceLabel(profile.sexualPreference);
  const distanceLabel = formatDistanceKm(profile.distanceKm);
  const memberSince = formatMonthYear(profile.memberSince);
  const locationLong = [profile.city, distanceLabel]
    .filter(Boolean)
    .join(' · ');
  const relationVariant = pickRelationVariant({
    connected: profile.connected,
    targetLiked: profile.targetLiked,
    targetViewedViewer: profile.targetViewedViewer,
  });

  const openReport = () => setShowReportConfirm(true);
  const openBlock = () => setShowBlockConfirm(true);

  const detailItems = [
    genderLabel && {
      icon: <UserIcon className="w-4 h-4" />,
      label: <span className="font-semibold">{genderLabel}</span>,
      accent: 'pink' as const,
    },
    preferenceLabel && {
      icon: <Heart className="w-4 h-4 fill-current" />,
      label: <span className="font-semibold">{preferenceLabel}</span>,
      accent: 'pink' as const,
    },
    locationLong && {
      icon: <MapPin className="w-4 h-4" />,
      label: locationLong,
      accent: 'pink' as const,
    },
    (profile.isOnline || profile.lastSeenAt) && {
      icon: <Clock className="w-4 h-4" />,
      label: profile.isOnline ? (
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          Online now
        </span>
      ) : (
        <>Active {relativeTime(profile.lastSeenAt!)}</>
      ),
      accent: 'pink' as const,
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: (
        <>
          Fame rating{' '}
          <span className="font-semibold">
            {Math.round(profile.fameRating)}
          </span>
        </>
      ),
      accent: 'pink' as const,
    },
    memberSince && {
      icon: <Calendar className="w-4 h-4" />,
      label: <>Member since {memberSince}</>,
      accent: 'pink' as const,
    },
  ].filter(Boolean) as {
    icon: React.ReactNode;
    label: React.ReactNode;
    accent: 'pink' | 'matcha';
  }[];

  return (
    <div className="flex flex-col w-full pb-10">
      <ProfileSubnav
        firstName={profile.firstName}
        lastName={profile.lastName}
        username={profile.username}
        onReport={openReport}
      />

      <div className="mx-auto w-full max-w-[560px] px-4">
        <ProfileCard>
          <ProfileHeroPhoto
            photos={heroPhotos}
            firstName={profile.firstName}
            lastName={profile.lastName}
            age={profile.age}
            genderLabel={genderLabel}
            orientationLabel={orientationLabel}
            fameRating={profile.fameRating}
            isOnline={profile.isOnline}
            lastSeenAt={profile.lastSeenAt}
            city={profile.city}
            distanceKm={profile.distanceKm}
            relationVariant={relationVariant}
          />

          <ProfileActionRow
            isLiked={isLiked}
            likeDisabled={likeDisabled}
            isConnected={profile.connected}
            onPass={() => router.back()}
            onLike={toggleLike}
            onReport={openReport}
            onBlock={openBlock}
          />

          <div className="flex flex-col gap-3.5 px-5 sm:px-6 pt-5 pb-5">
            {profile.bio && (
              <>
                <ProfileSection title={`About ${profile.firstName}`}>
                  <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </ProfileSection>
                <ProfileDivider />
              </>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <>
                <ProfileSection title="Interests">
                  <ProfileInterestTags tags={profile.interests} />
                </ProfileSection>
                <ProfileDivider />
              </>
            )}

            <ProfileSection title="Details">
              <ProfileDetailGrid items={detailItems} />
            </ProfileSection>
          </div>
        </ProfileCard>
      </div>

      {showBlockConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          onClick={() => !blocking && setShowBlockConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-border p-5 shadow-xl text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              Block {profile.firstName}?
            </h3>
            <p className="text-sm text-neutral-600 mt-2">
              They won&apos;t appear in your browse feed or search results, and
              you won&apos;t see each other&apos;s profile. Any existing likes
              between you will be removed.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                disabled={blocking}
                onClick={() => setShowBlockConfirm(false)}
                className="text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={blocking}
                onClick={confirmBlock}
                className="strawberry-matcha-btn text-white hover:opacity-90"
              >
                {blocking ? 'Blocking…' : 'Block'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReportConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          onClick={() => !reporting && setShowReportConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-border p-5 shadow-xl text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              Report {profile.firstName}?
            </h3>
            <p className="text-sm text-neutral-600 mt-2">
              Let us know what&apos;s wrong with this profile. Our team will
              review your report.
            </p>
            <label
              htmlFor="report-reason"
              className="block text-xs font-semibold text-neutral-700 mt-4 mb-1"
            >
              Reason
            </label>
            <select
              id="report-reason"
              value={reportReason}
              disabled={reporting}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="w-full h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="fake_account">Fake account</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
            </select>
            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                disabled={reporting}
                onClick={() => setShowReportConfirm(false)}
                className="text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={reporting}
                onClick={confirmReport}
                className="strawberry-matcha-btn text-white hover:opacity-90"
              >
                {reporting ? 'Reporting…' : 'Submit report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
