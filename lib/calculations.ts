import { Teacher, Assignment, TeacherMetrics } from '@/types/scheduler';

/**
 * Calculate teacher metrics (total load, available periods, total students)
 */
export function calculateTeacherMetrics(teacher: Teacher): TeacherMetrics {
  // Calculate total load (exclude CPT courses - they don't count toward load)
  const totalLoad = teacher.assignments
    .filter(a => !a.isCPT)
    .reduce((sum, a) => sum + a.load, 0);

  // Calculate available periods
  const availablePeriods = teacher.maxLoad - totalLoad;

  // Calculate total students across all assignments
  const totalStudents = teacher.assignments
    .reduce((sum, a) => sum + (a.students || 0), 0);

  return {
    totalLoad,
    availablePeriods,
    totalStudents
  };
}

/**
 * Enhance teacher data with calculated metrics
 */
export function enhanceTeacherWithMetrics(teacher: Teacher): Teacher {
  const metrics = calculateTeacherMetrics(teacher);

  // Calculate preps (number of distinct subjects/preparations taught)
  const preps = teacher.assignments.length;

  return {
    ...teacher,
    totalLoad: metrics.totalLoad,
    availablePeriods: metrics.availablePeriods,
    students: metrics.totalStudents,
    preps  // Auto-calculated from assignments
  };
}

/**
 * Calculate total students for a specific course group across all teachers
 */
export function calculateCourseGroupTotal(
  teachers: Teacher[],
  courseGroup: string
): number {
  return teachers.reduce((total, teacher) => {
    const groupAssignments = teacher.assignments.filter(
      a => a.courseGroup === courseGroup
    );
    return total + groupAssignments.reduce((sum, a) => sum + (a.students || 0), 0);
  }, 0);
}

/**
 * Calculate total load for a specific course group across all teachers
 */
export function calculateCourseGroupLoad(
  teachers: Teacher[],
  courseGroup: string
): number {
  return teachers.reduce((total, teacher) => {
    const groupAssignments = teacher.assignments.filter(
      a => a.courseGroup === courseGroup
    );
    return total + groupAssignments.reduce((sum, a) => sum + a.load, 0);
  }, 0);
}

/**
 * Get assignments grouped by course group for a teacher
 */
export function getAssignmentsByCourseGroup(
  assignments: Assignment[]
): Map<string, Assignment[]> {
  const grouped = new Map<string, Assignment[]>();

  assignments.forEach(assignment => {
    const existing = grouped.get(assignment.courseGroup) || [];
    grouped.set(assignment.courseGroup, [...existing, assignment]);
  });

  return grouped;
}

/**
 * Validate if a teacher can take on more load
 */
export function canTakeMoreLoad(teacher: Teacher, additionalLoad: number = 0): boolean {
  const metrics = calculateTeacherMetrics(teacher);
  return (metrics.totalLoad + additionalLoad) <= teacher.maxLoad;
}

/**
 * Calculate division totals
 */
export function calculateDivisionTotals(teachers: Teacher[]) {
  const ms = teachers.filter(t => t.division === 'MS');
  const hs = teachers.filter(t => t.division === 'HS');

  return {
    MS: {
      teachers: ms.length,
      totalLoad: ms.reduce((sum, t) => sum + (t.totalLoad || 0), 0),
      totalStudents: ms.reduce((sum, t) => sum + t.students, 0),
    },
    HS: {
      teachers: hs.length,
      totalLoad: hs.reduce((sum, t) => sum + (t.totalLoad || 0), 0),
      totalStudents: hs.reduce((sum, t) => sum + t.students, 0),
    }
  };
}
