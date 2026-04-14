'use client';

import { useRef } from 'react';
import { Upload, X, Heart } from 'lucide-react';
import Image from 'next/image';

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

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Click a photo to set it as your profile picture. Up to 5 photos.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {state.existing.map((pic) => (
          <div
            key={pic.url}
            className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
            style={{ borderColor: pic.isAvatar ? '#ec4899' : 'transparent' }}
            onClick={() => setExistingAsAvatar(pic.url)}
          >
            <Image src={presignedUrls[pic.url] ?? pic.url} alt="Profile photo" fill className="object-cover" />
            {pic.isAvatar && (
              <div className="absolute top-1 left-1 bg-pink-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                <Heart className="w-3 h-3 inline mr-0.5" />Profile
              </div>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeExisting(pic.url); }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {state.newFiles.map((file, index) => {
          const isAvatar = state.newAvatarIndex === index && !state.existing.find((p) => p.isAvatar);
          return (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
              style={{ borderColor: isAvatar ? '#ec4899' : 'transparent' }}
              onClick={() => setNewAsAvatar(index)}
            >
              <Image src={URL.createObjectURL(file)} alt={`New photo ${index + 1}`} fill className="object-cover" />
              {isAvatar && (
                <div className="absolute top-1 left-1 bg-pink-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                  <Heart className="w-3 h-3 inline mr-0.5" />Profile
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeNew(index); }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {total < 5 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            <Upload className="w-7 h-7 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">Upload</span>
          </label>
        )}
      </div>
    </div>
  );
}
