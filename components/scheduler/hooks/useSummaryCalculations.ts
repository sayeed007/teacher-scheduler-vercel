import { useMemo } from 'react';
import { Teacher, CourseGroup, CourseColumnMetadata } from '@/types/scheduler';
import { parseCourseNameFromColumnId } from '../utils/courseNameParser';
import { SummaryTotals, CourseTotals } from '../types/headerTypes';

export function useSummaryCalculations(
  visibleTeachers: Teacher[],
  courseGroups: CourseGroup[],
  collapsedCourseGroups: string[]
): SummaryTotals {
  return useMemo(() => {
    const visibleCourseGroups = courseGroups.filter(
      g => !collapsedCourseGroups.includes(g.id)
    );

    const courseTotals: Record<string, CourseTotals> = {};

    visibleCourseGroups.forEach(group => {
      const columnList = group?.columns || group?.courses || [];

      columnList.forEach(columnId => {
        const courseName = parseCourseNameFromColumnId(columnId, group.id);
        let totalStudents = 0;
        let totalLoad = 0;
        let studentCount = 0;

        visibleTeachers.forEach(teacher => {
          const assignment = teacher.assignments.find(
            a => a.courseName === courseName && a.courseGroup === group.id
          );
          if (assignment) {
            totalStudents += assignment.students || 0;
            totalLoad += assignment.load;
            if (assignment.students && assignment.students > 0) {
              studentCount++;
            }
          }
        });

        // Calculate remaining capacity from columnMetadata if available
        const metadata = group.columnMetadata?.find((m: CourseColumnMetadata) => m.columnId === columnId);
        const capacity = metadata?.periodsPerCycle || 0;
        const remaining = capacity > 0 ? capacity - totalLoad : 0;
        const periodsPerStudent = totalStudents > 0 ? totalLoad / totalStudents : 0;

        courseTotals[`${group.id}-${courseName}`] = {
          students: totalStudents,
          load: totalLoad,
          remaining,
          periodsPerStudent,
          studentCount,
        };
      });
    });

    return {
      totalTeachers: visibleTeachers.length,
      totalMaxLoad: visibleTeachers.reduce((sum, t) => sum + t.maxLoad, 0),
      totalAvailable: visibleTeachers.reduce((sum, t) => sum + (t.availablePeriods || 0), 0),
      totalPreps: visibleTeachers.reduce((sum, t) => sum + t.preps, 0),
      totalStudents: visibleTeachers.reduce((sum, t) => sum + t.students, 0),
      courseTotals,
    };
  }, [visibleTeachers, courseGroups, collapsedCourseGroups]);
}
