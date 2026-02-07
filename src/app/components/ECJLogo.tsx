import React, { useState } from 'react';
import { getBranding, getClientConfig } from '@/app/config';

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

/** Logo colors for Webian Contracting Inc (from WG Geophysics logo) */
const WEBIAN_RED = '#E2582A';
const WEBIAN_BLACK = '#000000';

/**
 * Config-driven logo: shows client logo (image or fallback) or ECJ logo for eventcoveragejamaica.
 */
export default function ECJLogo({ size = 'md', className = '' }: ECJLogoProps) {
  const config = getClientConfig();
  const branding = getBranding();
  const [imgError, setImgError] = useState(false);
  const dimensions = sizeMap[size] ?? sizeMap.md;

  // Webian Contracting Inc (or any non-ECJ client with no logo URL): show text/icon fallback
  if (config.clientId !== 'eventcoveragejamaica') {
    if (branding.logoUrl && !imgError) {
      return (
        <img
          src={branding.logoUrl}
          alt={branding.companyName}
          className={`object-contain object-left ${className}`}
          style={{ maxWidth: dimensions.width, maxHeight: dimensions.height, height: 'auto', width: 'auto', objectFit: 'contain' }}
          onError={() => setImgError(true)}
          loading="eager"
        />
      );
    }
    return (
      <WebianLogoFallback size={size} className={className} companyName={branding.companyName} shortName={branding.companyShortName} />
    );
  }

  // Event Coverage Jamaica: existing ECJ logo
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

/** Webian-style fallback: "WG" in red, company name in black (matches logo) */
function WebianLogoFallback({
  size,
  className,
  companyName,
  shortName,
}: {
  size: 'sm' | 'md' | 'lg' | 'xl';
  className: string;
  companyName: string;
  shortName: string;
}) {
  const dimensions = sizeMap[size] ?? sizeMap.md;
  const fontSize = size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 52;
  const subFontSize = Math.max(10, fontSize * 0.28);

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={companyName}
      preserveAspectRatio="xMinYMid meet"
    >
      <text
        x="0"
        y={fontSize}
        fontSize={fontSize}
        fontWeight="800"
        fill={WEBIAN_RED}
        fontFamily="Arial Black, sans-serif"
      >
        {shortName.charAt(0)}
      </text>
      <text
        x={fontSize * 0.7}
        y={fontSize}
        fontSize={fontSize}
        fontWeight="800"
        fill={WEBIAN_BLACK}
        fontFamily="Arial Black, sans-serif"
      >
        {shortName.length > 1 ? shortName.slice(1) : ''}
      </text>
      <text
        x="0"
        y={fontSize + subFontSize + 4}
        fontSize={subFontSize}
        fontWeight="600"
        fill={WEBIAN_BLACK}
        fontFamily="Arial, sans-serif"
      >
        {companyName}
      </text>
    </svg>
  );
}

/** Fallback SVG matching official ECJ brand */
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
      <text x="18" y="50" fontSize="42" fontWeight="800" fill="#E6E1D1" fontFamily="Arial Black, sans-serif">
        E
      </text>
      <circle cx="118" cy="38" r="28" fill="#BDFF1C" />
      <circle cx="118" cy="38" r="12" fill="#a5e00f" />
      <circle cx="121" cy="35" r="2.5" fill="white" opacity="0.9" />
      <text x="162" y="50" fontSize="42" fontWeight="800" fill="#E6E1D1" fontFamily="Arial Black, sans-serif">
        J
      </text>
      <path d="M 12 58 Q 140 66 268 58" stroke="#E6E1D1" strokeWidth="2" fill="none" />
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
