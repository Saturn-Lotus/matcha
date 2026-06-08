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
import {
  BlockConfirmDialog,
  ReportConfirmDialog,
} from './components/safety-dialogs';
import { MatchCelebration } from '@/app/components/match-celebration';

interface ProfileViewProps {
  id: string;
  viewerId: string;
  viewerHasAvatar: boolean;
}

export function ProfileView({
  id,
  viewerId,
  viewerHasAvatar,
}: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

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
        const { matched } = await apiClient.post<{ matched: boolean }>(
          `/users/${id}/likes`,
        );
        if (matched) setShowMatch(true);
      }
    } catch {
      setIsLiked(wasLiked);
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

      <BlockConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        targetId={id}
        targetName={profile.firstName}
        targetUsername={profile.username}
        onBlocked={() => router.replace('/browse')}
      />

      <ReportConfirmDialog
        open={showReportConfirm}
        onOpenChange={setShowReportConfirm}
        targetId={id}
        targetName={profile.firstName}
      />

      <MatchCelebration
        open={showMatch}
        viewer={{ name: 'You', avatarUrl: `/api/users/${viewerId}/avatar` }}
        matched={{ name: profile.firstName, avatarUrl: heroPhotos[0] ?? null }}
        onClose={() => setShowMatch(false)}
      />
    </div>
  );
}
