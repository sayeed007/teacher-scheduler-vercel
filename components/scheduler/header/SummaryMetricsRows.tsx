import { HeaderGroup } from '@tanstack/react-table';
import clsx from 'clsx';
import { CourseGroup, Teacher, CourseColumnMetadata } from '@/types/scheduler';
import { SummaryTotals, TeacherTableHeader, CourseGroupMeta } from '../types/headerTypes';

interface SummaryMetricsRowsProps {
  headerGroup: HeaderGroup<Teacher>;
  summaryTotals: SummaryTotals;
}

interface MetricConfig {
  label: string;
  bgClass: string;
  isBold?: boolean;
  getValue: (header: TeacherTableHeader, summaryTotals: SummaryTotals) => number | null;
}

const METRICS: MetricConfig[] = [
  {
    label: 'Total Students',
    bgClass: 'bg-gray-50',
    getValue: (header, summaryTotals) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const courseName = header.column.columnDef.header as string;
      const displayName = courseName.replace(' (OS)', '');
      return summaryTotals.courseTotals[`${courseGroup.id}-${displayName}`]?.students || 0;
    },
  },
  {
    label: 'Total Section',
    bgClass: 'bg-gray-50',
    getValue: (header) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const columnId = header.id.replace(`course-${courseGroup.id}-`, '');
      const metadata = courseGroup.columnMetadata?.find((m: CourseColumnMetadata) => m.columnId === columnId);
      return metadata?.totalSections || 0;
    },
  },
  {
    label: 'Total Period',
    bgClass: 'bg-gray-50',
    isBold: true,
    getValue: (header, summaryTotals) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const courseName = header.column.columnDef.header as string;
      const displayName = courseName.replace(' (OS)', '');
      return summaryTotals.courseTotals[`${courseGroup.id}-${displayName}`]?.load || 0;
    },
  },
  {
    label: 'Remaining Period',
    bgClass: 'bg-yellow-50',
    getValue: (header, summaryTotals) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const courseName = header.column.columnDef.header as string;
      const displayName = courseName.replace(' (OS)', '');
      return summaryTotals.courseTotals[`${courseGroup.id}-${displayName}`]?.remaining || 0;
    },
  },
  {
    label: 'Periods Per Cycle',
    bgClass: 'bg-gray-50',
    getValue: (header) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const columnId = header.id.replace(`course-${courseGroup.id}-`, '');
      const metadata = courseGroup.columnMetadata?.find((m: CourseColumnMetadata) => m.columnId === columnId);
      return metadata?.periodsPerCycle || 0;
    },
  },
  {
    label: 'Students Per Cycle',
    bgClass: 'bg-gray-50',
    getValue: (header) => {
      const meta = header.column.columnDef.meta as CourseGroupMeta;
      const courseGroup = meta?.courseGroup;
      if (!courseGroup) return null;
      const columnId = header.id.replace(`course-${courseGroup.id}-`, '');
      const metadata = courseGroup.columnMetadata?.find((m: CourseColumnMetadata) => m.columnId === columnId);
      return metadata?.studentsPerSection || 0;
    },
  },
];

export default function SummaryMetricsRows({
  headerGroup,
  summaryTotals,
}: SummaryMetricsRowsProps) {
  return (
    <>
      {METRICS.map((metric, rowIndex) => (
        <tr key={`metric-${rowIndex}`} className={`${metric.bgClass} font-medium text-xs`}>
          <th className="border border-gray-300 bg-gray-100" colSpan={6}></th>
          <th className="border border-gray-300 px-2 py-1 text-left bg-gray-100 font-semibold">
            {metric.label}
          </th>
          {headerGroup.headers.slice(8).map(header => {
            const meta = header.column.columnDef.meta as CourseGroupMeta;
            const isNumberOfCPTs = meta?.isNumberOfCPTs;
            const courseGroup = meta?.courseGroup;

            // Empty cell for Number of CPTs column
            if (isNumberOfCPTs) {
              return <td key={header.id} className="border border-gray-300 bg-gray-100"></td>;
            }

            if (!courseGroup) return null;

            const value = metric.getValue(header, summaryTotals);

            return (
              <td
                key={header.id}
                className={clsx(
                  'border border-gray-300 px-1 py-1 text-center',
                  metric.isBold && 'font-bold'
                )}
                style={{ backgroundColor: courseGroup.color }}
              >
                {value}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
