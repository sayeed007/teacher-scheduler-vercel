import { z } from 'zod';

export const assignmentSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  courseName: z.string().min(1, 'Course name is required'),
  courseGroup: z.string().min(1, 'Course group is required'),
  load: z.number().min(0, 'Load must be >= 0').int('Load must be an integer'),
  isCPT: z.boolean(),  // Common Planning Time (does NOT count toward load)
  students: z.number().min(0).int().optional(),
  color: z.string().optional() // Optional override color
});

export const teacherFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  division: z.enum(['MS', 'HS']),
  otherRole: z.string().max(100).optional().or(z.literal('')),
  maxLoad: z
    .number()
    .min(0, 'Max load must be >= 0')
    .max(40, 'Max load cannot exceed 40')
    .int('Max load must be an integer'),
  preps: z
    .number()
    .min(0, 'Preps must be >= 0')
    .int('Preps must be an integer'),
  students: z
    .number()
    .min(0, 'Students must be >= 0')
    .int('Students must be an integer'),
  assignments: z.array(assignmentSchema)
});
// COMMENTED OUT: Allow exceeding max load
// .refine(
//   (data) => {
//     // Calculate total non-CPT load
//     const totalLoad = data.assignments
//       .filter((a) => !a.isCPT)
//       .reduce((sum, a) => sum + a.load, 0);

//     return totalLoad <= data.maxLoad;
//   },
//   {
//     message: 'Total assigned load exceeds max load',
//     path: ['assignments']
//   }
// );

export type TeacherFormData = z.infer<typeof teacherFormSchema>;
export type AssignmentFormData = z.infer<typeof assignmentSchema>;
