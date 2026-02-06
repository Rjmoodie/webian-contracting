import React, { useState } from 'react';

// Official Event Coverage Jamaica logo (ECJ + neon green aperture/eye + EVENT COVERAGE JAMAICA)
import officialLogo from '@/assets/ecj-official-logo.png';

interface ECJLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  }

const sizeMap = {
  sm: { width: 72, height: 22 },
  md: { width: 107, height: 32 },
  lg: { width: 160, height: 48 },
  xl: { width: 250, height: 75 },
};

/**
 * Official ECJ logo: "ECJ" with E/J in #E6E1D1, C as neon green aperture/eye #BDFF1C,
 * curved underline, "EVENT COVERAGE JAMAICA" below.
 */
export default function ECJLogo({ size = 'md', className = '' }: ECJLogoProps) {
  const [imgError, setImgError] = useState(false);
  const dimensions = sizeMap[size] ?? sizeMap.md;

  if (imgError) {
    return <ECJLogoFallback size={size} className={className} />;
  }

  return (
    <img
      src={officialLogo}
      alt="Event Coverage Jamaica"
      width={dimensions.width}
      height={dimensions.height}
      className={`object-contain object-left ${className}`}
      style={{ maxWidth: dimensions.width, maxHeight: dimensions.height, height: 'auto', width: 'auto', objectFit: 'contain' }}
      onError={() => setImgError(true)}
      loading="eager"
      decoding="async"
    />
  );
}

/** Fallback SVG matching official brand: beige E/J, neon green C graphic, EVENT COVERAGE JAMAICA */
function ECJLogoFallback({ size, className }: { size: 'sm' | 'md' | 'lg' | 'xl'; className: string }) {
  const dimensions = sizeMap[size] ?? sizeMap.lg;
  const w = dimensions.width;
  const h = dimensions.height;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 280 84"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Event Coverage Jamaica"
      preserveAspectRatio="xMinYMid meet"
    >
      {/* E - light beige #E6E1D1 */}
      <text x="18" y="50" fontSize="42" fontWeight="800" fill="#E6E1D1" fontFamily="Arial Black, sans-serif">
        E
      </text>
      {/* C = neon green aperture/eye (#BDFF1C) */}
      <circle cx="118" cy="38" r="28" fill="#BDFF1C" />
      <circle cx="118" cy="38" r="12" fill="#a5e00f" />
      <circle cx="121" cy="35" r="2.5" fill="white" opacity="0.9" />
      {/* J - light beige */}
      <text x="162" y="50" fontSize="42" fontWeight="800" fill="#E6E1D1" fontFamily="Arial Black, sans-serif">
        J
      </text>
      {/* Curved underline */}
      <path
        d="M 12 58 Q 140 66 268 58"
        stroke="#E6E1D1"
        strokeWidth="2"
        fill="none"
      />
      {/* EVENT COVERAGE JAMAICA */}
      <text
        x="140"
        y="78"
        fontSize="11"
        fontWeight="600"
        fill="#E6E1D1"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        letterSpacing="1"
      >
        EVENT COVERAGE JAMAICA
      </text>
    </svg>
  );
}
