'use client';

import { useState, useRef } from 'react';
import type { OnboardingData } from './types';
import { uploadAndAnalyzeLogo } from '../logo-actions';

interface StepLogoProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepLogo({ data, onAdvance, onBack }: StepLogoProps) {
  const [preview, setPreview] = useState<string>(data.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);

    // Local preview while the upload + Vision call run
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      const result = await uploadAndAnalyzeLogo(data.subdomain, formData, data.shopName);
      onAdvance({
        logoUrl: result.logoUrl,
        brandColors: result.brandColors,
        logoContainsWordmark: result.logoContainsWordmark,
      });
    } catch (err) {
      setPreview(data.logoUrl);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  function handleSkip() {
    onAdvance({ logoUrl: '', brandColors: [], logoContainsWordmark: null });
  }

  function handleSubmit() {
    onAdvance({
      logoUrl: data.logoUrl,
      brandColors: data.brandColors,
      logoContainsWordmark: data.logoContainsWordmark,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">Got a logo?</h1>
        <p className="text-sm text-muted">
          Drop it here and we&apos;ll build your storefront around it — your colors, your brand. If
          you don&apos;t have one yet, skip and we&apos;ll design a beautiful wordmark for you.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file !== undefined) void handleFile(file);
        }}
        className={`flex aspect-[3/1] min-h-[180px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          preview !== ''
            ? 'border-honey/40 bg-bg-2'
            : 'border-white/15 bg-bg-2 hover:border-honey/40'
        }`}
      >
        {preview !== '' ? (
          // Display the preview at a constrained size to keep the upload area sane
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your logo" className="max-h-[150px] max-w-[80%] object-contain" />
        ) : (
          <div className="text-center">
            <p className="text-text">Click or drag to upload</p>
            <p className="mt-1 text-xs text-muted">PNG, JPEG, WebP, or SVG · up to 5MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file !== undefined) void handleFile(file);
          }}
        />
      </div>

      {uploading && <p className="text-sm text-muted">Reading your logo&apos;s colors…</p>}

      {error !== '' && <p className="text-sm text-red-400">{error}</p>}

      {data.brandColors.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Brand colors we found</p>
          <div className="flex gap-2">
            {data.brandColors.map((c) => (
              <div
                key={c}
                className="h-10 w-10 rounded border border-white/10"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-3 text-text transition-colors hover:bg-bg-2"
        >
          Back
        </button>
        {data.logoUrl !== '' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 rounded-lg border border-white/15 px-6 py-3 font-medium text-text transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Skip — I don&apos;t have a logo
          </button>
        )}
      </div>
    </div>
  );
}
