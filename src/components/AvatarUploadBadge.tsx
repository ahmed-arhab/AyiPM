'use client';

import React, { useRef } from 'react';
import { Plus, Camera } from 'lucide-react';

interface AvatarUploadBadgeProps {
  currentAvatar?: string;
  onImageSelected: (base64Image: string) => void;
  size?: number;
  alt?: string;
  className?: string;
  badgeSize?: number;
  showCameraHover?: boolean;
}

export default function AvatarUploadBadge({
  currentAvatar,
  onImageSelected,
  size = 64,
  alt = 'Employee avatar',
  badgeSize = 22,
  showCameraHover = true,
}: AvatarUploadBadgeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';

  const avatarSrc = currentAvatar || defaultAvatar;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageSelected(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
      }}
    >
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Upload employee image"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Profile Image with subtle interactive hover */}
      <div
        onClick={handleClick}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          border: '2px solid var(--border-subtle, #e2e8f0)',
          background: 'var(--bg-card-hover, #f8fafc)',
          transition: 'transform 0.2s ease, border-color 0.2s ease',
        }}
        title="Click to upload employee photo"
      >
        <img
          src={avatarSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {showCameraHover && (
          <div
            className="avatar-upload-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              borderRadius: '50%',
            }}
          >
            <Camera size={size * 0.3} color="#ffffff" />
          </div>
        )}
      </div>

      {/* + Badge at the bottom of the profile avatar */}
      <button
        type="button"
        onClick={handleClick}
        className="avatar-plus-badge"
        aria-label="Upload employee image"
        title="Upload employee image"
        style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: `${badgeSize}px`,
          height: `${badgeSize}px`,
          borderRadius: '50%',
          backgroundColor: 'var(--primary, #0284c7)',
          color: '#ffffff',
          border: '2px solid var(--bg-card, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.22)',
          transition: 'transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
          zIndex: 2,
          padding: 0,
        }}
      >
        <Plus size={Math.max(11, Math.round(badgeSize * 0.6))} strokeWidth={3} />
      </button>

      <style jsx>{`
        div:hover .avatar-upload-overlay {
          opacity: 1 !important;
        }
        .avatar-plus-badge:hover {
          transform: scale(1.15);
          background-color: var(--primary-hover, #0369a1) !important;
          box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4) !important;
        }
      `}</style>
    </div>
  );
}
