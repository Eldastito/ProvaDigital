/**
 * FORGE Multi-Tenant Theme Engine
 * 
 * Allows each institution (tenant) to customize:
 * - Brand colors (primary, secondary, accent, navy, teal)
 * - Logo (URL)
 * - App name
 * 
 * Theme is loaded from tenant settings and applied via CSS custom properties
 * on the <html> element using the data-tenant attribute.
 */

export interface TenantTheme {
  slug: string;
  name: string;
  logoUrl?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    navy?: string;
    teal?: string;
    mint?: string;
  };
}

const EXAMPAD_DEFAULT: TenantTheme = {
  slug: 'examepad',
  name: 'ExamePad',
  logoUrl: '/social1.png',
  colors: {
    primary: '#1b6ca8',
    secondary: '#0ca3e1',
    accent: '#46c4f3',
    navy: '#112131',
    teal: '#00ae84',
    mint: '#1cd3a2',
  },
};

/**
 * Apply a tenant theme to the document.
 * Sets CSS custom properties on :root and data-tenant on <html>.
 */
export function applyTenantTheme(theme: TenantTheme): void {
  const root = document.documentElement;
  
  // Set tenant identifier
  root.setAttribute('data-tenant', theme.slug);
  
  // Apply color overrides
  if (theme.colors) {
    const colorMap: Record<string, string> = {
      primary: '--forge-brand-primary',
      secondary: '--forge-brand-secondary',
      accent: '--forge-brand-accent',
      navy: '--forge-brand-navy',
      teal: '--forge-brand-teal',
      mint: '--forge-brand-mint',
    };
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value && colorMap[key]) {
        root.style.setProperty(colorMap[key], value);
      }
    });
  }
}

/**
 * Reset theme to ExamePad defaults.
 */
export function resetToDefaultTheme(): void {
  applyTenantTheme(EXAMPAD_DEFAULT);
}

/**
 * Get the current theme colors from computed CSS.
 */
export function getCurrentThemeColors(): Record<string, string> {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  
  return {
    primary: computed.getPropertyValue('--forge-brand-primary').trim(),
    secondary: computed.getPropertyValue('--forge-brand-secondary').trim(),
    accent: computed.getPropertyValue('--forge-brand-accent').trim(),
    navy: computed.getPropertyValue('--forge-brand-navy').trim(),
    teal: computed.getPropertyValue('--forge-brand-teal').trim(),
    mint: computed.getPropertyValue('--forge-brand-mint').trim(),
  };
}

/**
 * Generate a local avatar with initials (air-gapped friendly, no external API).
 */
export function generateLocalAvatar(name: string, size: number = 40): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Get brand colors
  const computed = getComputedStyle(document.documentElement);
  const bgColor = computed.getPropertyValue('--forge-brand-primary').trim() || '#1b6ca8';

  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.25);
  ctx.fill();

  // Initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.38}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 1);

  return canvas.toDataURL('image/png');
}

export { EXAMPAD_DEFAULT };
