import { CourseGroup, Division } from '@/types/scheduler';

/**
 * Get course group color by ID
 */
export function getCourseGroupColor(
  courseGroups: CourseGroup[],
  groupId: string
): string {
  const group = courseGroups.find(g => g.id === groupId);
  return group?.color || '#E0E0E0';
}

/**
 * Get division background color
 */
export function getDivisionColor(division: Division): string {
  return division === 'MS' ? '#E8F5E9' : '#FFF9C4';
}

/**
 * Get division text color (darker variant)
 */
export function getDivisionTextColor(division: Division): string {
  return division === 'MS' ? '#2E7D32' : '#F57F17';
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Get a lighter variant of a color (for hover states)
 */
export function lightenColor(hex: string, percent: number = 20): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const increase = (val: number) => Math.min(255, Math.floor(val + (255 - val) * (percent / 100)));

  const r = increase(rgb.r).toString(16).padStart(2, '0');
  const g = increase(rgb.g).toString(16).padStart(2, '0');
  const b = increase(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Get a darker variant of a color (for borders)
 */
export function darkenColor(hex: string, percent: number = 20): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const decrease = (val: number) => Math.max(0, Math.floor(val * (1 - percent / 100)));

  const r = decrease(rgb.r).toString(16).padStart(2, '0');
  const g = decrease(rgb.g).toString(16).padStart(2, '0');
  const b = decrease(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Check if a color is light or dark (for text contrast)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? '#000000' : '#FFFFFF';
}
