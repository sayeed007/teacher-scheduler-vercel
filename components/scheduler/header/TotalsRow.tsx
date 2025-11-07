import { HeaderGroup } from '@tanstack/react-table';
import { CourseGroup, Teacher } from '@/types/scheduler';
import { SummaryTotals, CourseGroupMeta } from '../types/headerTypes';

interface TotalsRowProps {
  headerGroup: HeaderGroup<Teacher>;
  visibleTeachers: Teacher[];
  summaryTotals: SummaryTotals;
}

export default function TotalsRow({
  headerGroup,
  visibleTeachers,
  summaryTotals,
}: TotalsRowProps) {
  return (
    <tr className="bg-blue-100 font-bold text-xs border-t-2 border-gray-400">
      <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">TOTALS</th>
      <th className="border border-gray-300 bg-blue-100"></th>
      <th className="border border-gray-300 bg-blue-100"></th>
      <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">
        {summaryTotals.totalMaxLoad}
      </th>
      <th className="border border-gray-300 px-2 py-2 text-center text-green-700 bg-blue-100">
        {summaryTotals.totalAvailable}
      </th>
      <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">
        {summaryTotals.totalPreps}
      </th>
      <th className="border border-gray-300 px-2 py-2 text-center bg-blue-100">
        {summaryTotals.totalStudents}
      </th>
      <th className="border border-gray-300 bg-blue-100"></th>
      {/* Course totals and Number of CPTs */}
      {headerGroup.headers.slice(8).map(header => {
        const meta = header.column.columnDef.meta as CourseGroupMeta;
        const courseGroup = meta?.courseGroup;
        const isNumberOfCPTs = meta?.isNumberOfCPTs;

        // Handle Number of CPTs column
        if (isNumberOfCPTs) {
          const totalCPTCount = visibleTeachers.reduce((sum, t) =>
            sum + (t.assignments?.filter(a => a.isCPT).length || 0), 0
          );
          return (
            <th
              key={header.id}
              className="border border-gray-300 px-2 py-2 text-center bg-blue-100"
            >
              {totalCPTCount}
            </th>
          );
        }

        // Handle course columns
        if (!courseGroup) return null;

        const courseName = header.column.columnDef.header as string;
        const displayName = courseName.replace(' (OS)', '');
        const totals = summaryTotals.courseTotals[`${courseGroup.id}-${displayName}`];

        return (
          <td
            key={header.id}
            className="border border-gray-300 px-1 py-2 text-center"
            style={{ backgroundColor: courseGroup.color }}
          >
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm">{totals?.load || 0}</span>
              <span className="text-[10px] text-gray-600">({totals?.students || 0})</span>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
