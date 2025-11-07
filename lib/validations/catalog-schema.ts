import { z } from 'zod';

// Course Group Schema
export const courseGroupSchema = z.object({
  id: z
    .string()
    .min(1, 'Group ID is required')
    .max(50, 'Group ID is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Group ID can only contain letters, numbers, hyphens, and underscores'),
  label: z
    .string()
    .min(1, 'Group label is required')
    .max(100, 'Group label is too long'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF5733)'),
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order must be >= 0'),
  columns: z.array(z.string()),
  isSystem: z.boolean().optional()
});

export type CourseGroupFormData = z.infer<typeof courseGroupSchema>;

// Course Schema
export const courseSchema = z.object({
  id: z
    .string()
    .min(1, 'Course ID is required')
    .max(50, 'Course ID is too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Course ID can only contain letters, numbers, hyphens, and underscores'),
  label: z
    .string()
    .min(1, 'Course label is required')
    .max(100, 'Course label is too long'),
  group: z
    .string()
    .min(1, 'Course group is required'),
  isCPT: z.boolean()
});

export type CourseFormData = z.infer<typeof courseSchema>;

// Slug generator helper
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Color presets for quick selection
export const COLOR_PRESETS = [
  { name: 'Yellow', hex: '#FBE8A6' },
  { name: 'Blue', hex: '#A6C1EE' },
  { name: 'Green', hex: '#B5EAD7' },
  { name: 'Pink', hex: '#FFB6C1' },
  { name: 'Orange', hex: '#FDB777' },
  { name: 'Purple', hex: '#E6E6FA' },
  { name: 'Mint', hex: '#C7CEEA' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Lavender', hex: '#E0BBE4' },
  { name: 'Coral', hex: '#FF7F50' }
];
