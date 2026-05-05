'use client';

import { useRef } from 'react';
import { Star, Trash2, Camera } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type ExistingPicture = { url: string; isAvatar: boolean };

export interface PicturesState {
  existing: ExistingPicture[];
  newFiles: File[];
  newAvatarIndex: number | null;
}

interface PhotoGalleryProps {
  state: PicturesState;
  presignedUrls: Record<string, string>;
  onChange: (state: PicturesState) => void;
}

export function PhotoGallery({ state, presignedUrls, onChange }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const total = state.existing.length + state.newFiles.length;

  const setExistingAsAvatar = (url: string) => {
    onChange({
      ...state,
      existing: state.existing.map((p) => ({ ...p, isAvatar: p.url === url })),
      newAvatarIndex: null,
    });
  };

  const setNewAsAvatar = (index: number) => {
    onChange({
      ...state,
      existing: state.existing.map((p) => ({ ...p, isAvatar: false })),
      newAvatarIndex: index,
    });
  };

  const removeExisting = (url: string) => {
    const next = state.existing.filter((p) => p.url !== url);
    const wasAvatar = state.existing.find((p) => p.url === url)?.isAvatar;
    if (wasAvatar && next.length > 0) next[0].isAvatar = true;
    onChange({ ...state, existing: next });
  };

  const removeNew = (index: number) => {
    const next = state.newFiles.filter((_, i) => i !== index);
    let newAvatarIndex = state.newAvatarIndex;
    if (newAvatarIndex === index) newAvatarIndex = null;
    else if (newAvatarIndex !== null && newAvatarIndex > index) newAvatarIndex--;
    onChange({ ...state, newFiles: next, newAvatarIndex });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 5 - total);
    onChange({ ...state, newFiles: [...state.newFiles, ...toAdd] });
    e.target.value = '';
  };

  type PhotoItem =
    | { kind: 'existing'; pic: ExistingPicture }
    | { kind: 'new'; file: File; index: number; isAvatar: boolean };

  const photos: PhotoItem[] = [
    ...state.existing.map((pic) => ({ kind: 'existing' as const, pic })),
    ...state.newFiles.map((file, index) => ({
      kind: 'new' as const,
      file,
      index,
      isAvatar: state.newAvatarIndex === index && !state.existing.find((p) => p.isAvatar),
    })),
  ];

  const avatarIdx = photos.findIndex((p) =>
    p.kind === 'existing' ? p.pic.isAvatar : p.isAvatar,
  );
  const isAvatar = (i: number) => i === avatarIdx;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {photos.map((item, i) => {
          const avatar = isAvatar(i);
          const src =
            item.kind === 'existing'
              ? (presignedUrls[item.pic.url] ?? item.pic.url)
              : URL.createObjectURL(item.file);

          return (
            <div
              key={item.kind === 'existing' ? item.pic.url : `new-${item.index}`}
              className={cn('relative group rounded-2xl overflow-hidden bg-zinc-100', {
                'col-span-2 aspect-[3/4] ring-2 ring-rose-400 order-first': avatar,
                'col-span-1 aspect-[3/4]': !avatar,
              })}
            >
              <Image src={src} alt="Profile photo" fill className="object-cover" />

              {avatar && (
                <div className="absolute top-3 left-3 bg-rose-400 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Main
                </div>
              )}

              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!avatar && (
                  <button
                    type="button"
                    onClick={() =>
                      item.kind === 'existing'
                        ? setExistingAsAvatar(item.pic.url)
                        : setNewAsAvatar(item.index)
                    }
                    title="Set as main"
                    className="bg-white/90 p-2 rounded-full text-rose-500 hover:bg-white transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    item.kind === 'existing'
                      ? removeExisting(item.pic.url)
                      : removeNew(item.index)
                  }
                  title="Remove photo"
                  className="bg-white/90 p-2 rounded-full text-zinc-600 hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {total < 5 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1.5 bg-white/50 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer ${
              total === 0 ? 'col-span-2' : 'col-span-1'
            }`}
          >
            <Camera className="w-6 h-6 text-zinc-300" />
            <span className="text-[11px] text-zinc-400 font-medium">Add Photo</span>
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-400 mt-3">
        Click a photo to set it as your profile picture. Up to 5 photos.
      </p>
    </div>
  );
}
