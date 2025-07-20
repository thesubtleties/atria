import { z } from 'zod';

// Schema for updating speaker info
export const speakerInfoSchema = z.object({
  speaker_title: z.string()
    .max(200, 'Title is too long')
    .optional()
    .transform(val => val === '' ? null : val),
  speaker_bio: z.string()
    .max(2000, 'Bio is too long')
    .optional()
    .transform(val => val === '' ? null : val),
});

// Schema for CSV import
export const speakerImportSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a CSV file',
  }).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    'File must be a CSV'
  ),
});

// Helper function to format session count
export const formatSessionCount = (count) => {
  if (count === 0) return 'No sessions';
  if (count === 1) return '1 session';
  return `${count} sessions`;
};