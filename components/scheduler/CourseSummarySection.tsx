'use client';

import { useMemo } from 'react';
import { CourseGroup, Teacher, CourseColumnMetadata } from '@/types/scheduler';
import clsx from 'clsx';

interface CourseSummarySectionProps {
  teachers: Teacher[];
  courseGroups: CourseGroup[];
  collapsedCourseGroups: string[];
  staticColumnsCount: number; // Number of static columns before courses
}

// Helper function to parse course name from column ID
function parseCourseNameFromColumnId(columnId: string, groupId: string): string {
  const prefix = `${groupId}_`;
  if (columnId.startsWith(prefix)) {
    const nameWithoutGroup = columnId.substring(prefix.length);
    return nameWithoutGroup.replace(/_/g, ' ');
  }

  if (!columnId.includes('_')) {
    return columnId;
  }

  const parts = columnId.split('_');
  parts.shift();

  if (parts.length === 1) {
    return parts[0];
  }

  const base = parts[0];
  const suffix = parts[parts.length - 1];
  const middle = parts.slice(1, -1);

  if (middle.length > 0) {
    return `${base}(${middle.join('')})${suffix}`;
  }

  return `${base}${suffix}`;
}

export default function CourseSummarySection({
  teachers,
  courseGroups,
  collapsedCourseGroups,
  staticColumnsCount,
}: CourseSummarySectionProps) {
  // Calculate summary data for each course
  const courseSummaryData = useMemo(() => {
    const visibleCourseGroups = courseGroups.filter(
      g => !collapsedCourseGroups.includes(g.id)
    );

    const summaryMap = new Map<string, {
      groupId: string;
      columnId: string;
      courseName: string;
      color: string;
      totalStudents: number;
      totalPeriods: number;
      metadata?: CourseColumnMetadata;
    }>();

    visibleCourseGroups.forEach(group => {
      const columnList = group?.columns || group?.courses || [];

      columnList.forEach((columnId: string) => {
        const courseName = parseCourseNameFromColumnId(columnId, group.id);
        let totalStudents = 0;
        let totalPeriods = 0;

        // Calculate from teacher assignments
        teachers.forEach(teacher => {
          const assignment = teacher.assignments.find(
            a => a.courseName === courseName && a.courseGroup === group.id
          );
          if (assignment) {
            totalStudents += assignment.students || 0;
            totalPeriods += assignment.load;
          }
        });

        // Get metadata for this column
        const metadata = group.columnMetadata?.find(m => m.columnId === columnId);

        const key = `${group.id}-${columnId}`;
        summaryMap.set(key, {
          groupId: group.id,
          columnId,
          courseName,
          color: group.color,
          totalStudents,
          totalPeriods,
          metadata,
        });
      });
    });

    return Array.from(summaryMap.values());
  }, [teachers, courseGroups, collapsedCourseGroups]);

  const summaryRows = [
    {
      label: 'PPC',
      tooltip: 'Periods Per Cycle',
      getValue: (data: typeof courseSummaryData[0]) => data.metadata?.periodsPerCycle || '-',
    },
    {
      label: 'Total Sec',
      tooltip: 'Total Sections',
      getValue: (data: typeof courseSummaryData[0]) => data.metadata?.totalSections || '-',
    },
    {
      label: 'Total Per',
      tooltip: 'Total Periods',
      getValue: (data: typeof courseSummaryData[0]) => data.totalPeriods,
    },
    {
      label: 'Remaining',
      tooltip: 'Remaining Periods',
      getValue: (data: typeof courseSummaryData[0]) => data.metadata?.remainingPeriod || 0,
    },
    {
      label: 'Periods p',
      tooltip: 'Periods Per Cycle',
      getValue: (data: typeof courseSummaryData[0]) => {
        // Calculate: Total Sections * Periods Per Cycle
        const sections = data.metadata?.totalSections || 0;
        const ppc = data.metadata?.periodsPerCycle || 0;
        return sections && ppc ? sections * ppc : '-';
      },
    },
    {
      label: 'Student p',
      tooltip: 'Students Per Section',
      getValue: (data: typeof courseSummaryData[0]) => data.metadata?.studentsPerSection || '-',
    },
  ];

  return (
    <div className="border-b border-gray-300 bg-gray-50">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {summaryRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-200">
                {/* Empty cells for static columns */}
                {Array.from({ length: staticColumnsCount }).map((_, colIndex) => (
                  <td
                    key={`static-${colIndex}`}
                    className="border-r border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100"
                  >
                    {colIndex === 0 ? row.label : ''}
                  </td>
                ))}

                {/* Course summary cells */}
                {courseSummaryData.map((data, dataIndex) => (
                  <td
                    key={`course-${dataIndex}`}
                    className="border-r border-gray-300 px-1 py-1 text-center text-xs font-semibold"
                    style={{ backgroundColor: data.color }}
                    title={`${row.tooltip}: ${row.getValue(data)}`}
                  >
                    {row.getValue(data)}
                  </td>
                ))}

                {/* Empty cell for last column (Number of CPTs) */}
                <td className="border-r border-gray-300 px-2 py-1 bg-gray-100"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
