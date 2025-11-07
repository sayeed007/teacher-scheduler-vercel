import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CourseGroup, Teacher } from '@/types/scheduler';
import { CourseGroupMeta } from '../types/headerTypes';

interface CourseHeaderRowProps {
  headerGroup: HeaderGroup<Teacher>;
  isSummaryExpanded: boolean;
  onToggleExpand: () => void;
}

export default function CourseHeaderRow({
  headerGroup,
  isSummaryExpanded,
  onToggleExpand,
}: CourseHeaderRowProps) {
  return (
    <tr>
      {/* Collapse/Expand button - spans rows 1-7 when expanded, just row 1 when collapsed */}
      <th className="border border-gray-300 px-2 py-2 bg-gray-100" rowSpan={isSummaryExpanded ? 7 : 1}>
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="hover:bg-gray-200 rounded p-1"
            title={isSummaryExpanded ? 'Collapse summary' : 'Expand summary'}
          >
            {isSummaryExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </th>
      {/* Empty columns 2-8 for row 1 */}
      <th className="border border-gray-300 bg-gray-100" colSpan={7}></th>
      {/* Course column headers + Number of CPTs */}
      {headerGroup.headers.slice(8).map(header => {
        const meta = header.column.columnDef.meta as CourseGroupMeta;
        const courseGroup = meta?.courseGroup;
        const isNumberOfCPTs = meta?.isNumberOfCPTs;

        // Handle Number of CPTs column - show header
        if (isNumberOfCPTs) {
          return (
            <th
              key={header.id}
              style={{ width: header.getSize() }}
              className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-900 bg-gray-100"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          );
        }

        // Course columns - show course name
        if (!courseGroup) return null;

        return (
          <th
            key={header.id}
            style={{
              width: header.getSize(),
              backgroundColor: courseGroup.color,
            }}
            className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-900"
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        );
      })}
    </tr>
  );
}
