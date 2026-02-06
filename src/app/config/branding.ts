/**
 * Branding Configuration (DEPRECATED)
 * 
 * ⚠️ This file is deprecated. Use the new config system instead:
 * 
 * import { getBranding } from '@/app/config';
 * const branding = getBranding();
 * 
 * This file is kept for backward compatibility but will be removed in a future version.
 * All new code should use src/app/config/index.ts
 */

import { getBranding as getBrandingFromConfig } from './index';
import type { BrandingConfig } from './types';

// Re-export for backward compatibility
export type { BrandingConfig };

// Legacy exports - now use centralized config
export const getBranding = (): BrandingConfig => {
  return getBrandingFromConfig();
};

// Legacy default - now pulls from client config
export const defaultBranding = getBranding();
