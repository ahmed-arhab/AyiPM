import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function BrandLogo({ size = 'md', showSubtitle = true }: BrandLogoProps) {
  const iconHeight = size === 'sm' ? 26 : size === 'md' ? 34 : 44;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* Uploaded AX Brand Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `${iconHeight + 6}px`,
          width: `${Math.round(iconHeight * 1.55)}px`,
          position: 'relative',
        }}
      >
        <img
          src="/logo.png"
          alt="Ayitrix Logo"
          style={{
            height: `${iconHeight}px`,
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 8px rgba(0, 102, 255, 0.25))',
          }}
        />
      </div>

      {/* Brand Wordmark & System Tag */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#0f172a',
              fontFamily: 'var(--font-sans)',
            }}
          >
            AYITRIX
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
            }}
          >
            PM
          </span>
        </div>
        {showSubtitle && (
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            People & Delivery Platform
          </div>
        )}
      </div>
    </div>
  );
}
