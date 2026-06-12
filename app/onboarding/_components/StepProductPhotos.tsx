'use client';

import { useState, useRef } from 'react';
import type { OnboardingData } from './types';
import { MAX_PRODUCT_PHOTOS } from './types';
import { uploadProductPhotos } from '../product-photos-actions';

interface StepProductPhotosProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepProductPhotos({ data, onAdvance, onBack }: StepProductPhotosProps) {
  const [previews, setPreviews] = useState<string[]>(data.productPhotoUrls);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const spaceLeft = MAX_PRODUCT_PHOTOS - (previews.length + pending.length);
    const accepted = incoming.slice(0, spaceLeft);
    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  }

  function removeAt(idx: number) {
    setPending((prev) => prev.filter((_, i) => i !== (idx - data.productPhotoUrls.length)));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUploadAndContinue() {
    if (pending.length === 0) {
      onAdvance({
        productPhotoUrls: data.productPhotoUrls,
        visionPerPhoto: data.visionPerPhoto,
        makerWork: data.makerWork,
      });
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      for (const f of pending) formData.append('photos', f);
      const result = await uploadProductPhotos(data.subdomain, formData);
      onAdvance({
        productPhotoUrls: result.productPhotoUrls,
        visionPerPhoto: result.visionPerPhoto,
        makerWork: result.makerWork,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  function handleSkip() {
    onAdvance({ productPhotoUrls: [], visionPerPhoto: [], makerWork: '' });
  }

  const total = previews.length;
  const canAdd = total < MAX_PRODUCT_PHOTOS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">Got a few product photos handy?</h1>
        <p className="text-sm text-muted">
          Upload up to 5 and we&apos;ll build with your real work. Skip and we&apos;ll use stand-ins
          you swap later — either way you get a live store in five minutes.
        </p>
      </div>

      <div
        onClick={() => canAdd && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (canAdd) addFiles(e.dataTransfer.files);
        }}
        className={`flex aspect-[3/1] min-h-[180px] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          canAdd ? 'cursor-pointer border-white/15 bg-bg-2 hover:border-honey/40' : 'border-honey/20 bg-bg-2'
        }`}
      >
        {total === 0 ? (
          <div className="text-center">
            <p className="text-text">Click or drag to upload</p>
            <p className="mt-1 text-xs text-muted">Up to 5 photos · PNG, JPEG, or WebP · 10MB each</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 px-4 py-4">
            {previews.map((url, i) => (
              <div key={url + i} className="relative aspect-square overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(i);
                  }}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg/80 text-text-soft hover:bg-bg"
                >
                  ×
                </button>
              </div>
            ))}
            {canAdd && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="flex aspect-square items-center justify-center rounded border-2 border-dashed border-white/15 text-2xl text-muted hover:border-honey/40 hover:text-text"
                aria-label="Add another photo"
              >
                +
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {uploading && <p className="text-sm text-muted">Studying your work…</p>}
      {error !== '' && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="rounded-lg border border-white/10 px-5 py-3 text-text transition-colors hover:bg-bg-2 disabled:opacity-30"
        >
          Back
        </button>
        {total > 0 ? (
          <button
            type="button"
            onClick={handleUploadAndContinue}
            disabled={uploading}
            className="flex-1 rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {uploading ? 'Uploading…' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 rounded-lg border border-white/15 px-6 py-3 font-medium text-text transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Skip — I&apos;ll add photos later
          </button>
        )}
      </div>
    </div>
  );
}
