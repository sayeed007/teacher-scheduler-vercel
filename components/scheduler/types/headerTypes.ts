import { Header } from '@tanstack/react-table';
import { Teacher, CourseGroup, CourseColumnMetadata } from '@/types/scheduler';

/**
 * Extended CourseGroup with guaranteed columnMetadata
 */
export interface CourseGroupWithMetadata extends CourseGroup {
  columnMetadata: CourseColumnMetadata[];
}

/**
 * Column metadata for course groups
 */
export interface CourseGroupMeta {
  courseGroup?: CourseGroup;
  isNumberOfCPTs?: boolean;
}

/**
 * Type for header with course group metadata
 */
export type TeacherTableHeader = Header<Teacher, unknown>;

/**
 * Summary totals structure
 */
export interface SummaryTotals {
  totalTeachers: number;
  totalMaxLoad: number;
  totalAvailable: number;
  totalPreps: number;
  totalStudents: number;
  courseTotals: Record<string, CourseTotals>;
}

/**
 * Course totals structure
 */
export interface CourseTotals {
  students: number;
  load: number;
  remaining: number;
  periodsPerStudent: number;
  studentCount: number;
}
