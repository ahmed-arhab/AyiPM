import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showWordmark?: boolean;
}

export default function BrandLogo({
  size = 'md',
  showSubtitle = true,
  showWordmark = true,
}: BrandLogoProps) {
  const iconHeight = size === 'sm' ? 26 : size === 'md' ? 34 : 44;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showWordmark ? '0.75rem' : 0 }}>
      {/* Uploaded AX Brand Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `${iconHeight}px`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <img
          src="/logo.png"
          alt="Ayitrix Logo"
          style={{
            height: `${iconHeight}px`,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 2px 8px rgba(0, 102, 255, 0.22))',
          }}
        />
      </div>

      {/* Brand Wordmark & System Tag */}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1 }}>
            <span
              style={{
                fontSize: size === 'sm' ? '0.95rem' : size === 'md' ? '1.2rem' : '1.45rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                color: '#0f172a',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.1,
              }}
            >
              AYITRIX
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                padding: '0.12rem 0.38rem',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              PM
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
