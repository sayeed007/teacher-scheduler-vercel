// Core data models for the Teacher Scheduler Application

export type Division = 'MS' | 'HS';

export interface Assignment {
  courseId: string;             // Reference to course
  courseName: string;           // Denormalized for performance (e.g., "CCW6")
  courseGroup: string;          // Group identifier (e.g., "CCW6", "CCW7")
  load: number;                 // Number of periods (e.g., 6, 9, 2)
  isCPT: boolean;               // Whether this is a Common Planning Time course (does NOT count toward load)
  students?: number;            // Students in this specific course
  color?: string;               // Optional override color
}

export interface Teacher {
  id: string;                   // Unique identifier (UUID)
  name: string;                 // Teacher's full name
  division: Division;           // Middle School or High School
  otherRole?: string;          // Additional role (e.g., "MS CHN", "Drama")
  maxLoad: number;             // Maximum class loads per 8-day cycle
  preps: number;               // Number of distinct subjects/preparations taught
  students: number;            // Total number of students taught
  assignments: Assignment[];    // Course assignments array

  // Computed fields (calculated on frontend)
  totalLoad?: number;          // Sum of all assignment loads
  availablePeriods?: number;   // maxLoad - totalLoad
}

export interface CourseColumnMetadata {
  columnId: string;            // Column identifier (e.g., "CCW6_CCW6")
  totalSections: number;       // Total number of sections this course is running
  periodsPerCycle: number;     // Periods per cycle for this course
  remainingPeriod: number;     // Remaining periods (mostly 0)
  studentsPerSection: number;  // Average students per section
}

export interface CourseGroup {
  id: string;                  // Unique identifier (e.g., "CCW6")
  name?: string;               // Display name (e.g., "CCW 6") - optional for backward compatibility
  label: string;               // Display label (e.g., "CCW 6")
  color: string;               // Hex color code for visual grouping
  order: number;               // Display order in grid
  courses?: string[];          // List of course IDs in this group - optional for backward compatibility
  columns: string[];           // List of column identifiers in this group
  isSystem?: boolean;          // System-managed group (cannot be deleted, e.g., OTHER_SUBJECTS)
  columnMetadata?: CourseColumnMetadata[];  // Metadata for each column
}

export interface DivisionConfig {
  division: Division;
  color: string;               // Row background color
  label: string;               // Display label
  order: number;               // Display order
}

export interface SchedulerData {
  teachers: Teacher[];
  courseGroups: CourseGroup[];
  divisions: DivisionConfig[];
  metadata?: {
    totalTeachers: number;
    lastUpdated: string;
  };
}

// Persisted state in localStorage
export interface PersistedSchedulerState {
  collapsedCourseGroups: string[];     // Array of collapsed group IDs
  collapsedDivisions: Division[];      // Array of collapsed divisions
  sortBy: string | null;               // Current sort column
  prepsThreshold: number;              // Threshold for CPT/Prep count (default: 3)
  lastAccessed: string;                // Timestamp
}

// Computed teacher metrics
export interface TeacherMetrics {
  totalLoad: number;
  availablePeriods: number;
  totalStudents: number;
}

// Sort configuration
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Drag and drop types
export interface DragItem {
  teacherId: string;
  assignment: Assignment;
  sourceIndex: number;
}

export interface DropTarget {
  teacherId: string;
  courseGroup: string;
  isValid: boolean;
}

// Error types for API responses
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface DeleteReference {
  type: 'teacher' | 'course';
  id: string;
  name: string;
}

// Union type for errors that can be thrown
export type AppError = Error | { message: string; status?: number }
