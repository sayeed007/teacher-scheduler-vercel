import { flexRender, HeaderGroup } from '@tanstack/react-table';
import clsx from 'clsx';
import { CourseGroup, Teacher } from '@/types/scheduler';
import { CourseGroupMeta } from '../types/headerTypes';

interface StaticHeadersRowProps {
  headerGroup: HeaderGroup<Teacher>;
}

export default function StaticHeadersRow({ headerGroup }: StaticHeadersRowProps) {
  return (
    <tr className="bg-gray-100">
      {/* First 8 static column headers (Teacher, Division, etc.) */}
      {headerGroup.headers.slice(0, 8).map(header => (
        <th
          key={header.id}
          style={{ width: header.getSize() }}
          className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-900"
        >
          <div
            className={clsx(
              'flex items-center justify-center',
              header.column.getCanSort() && 'cursor-pointer select-none'
            )}
            onClick={header.column.getToggleSortingHandler()}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {{
              asc: ' 🔼',
              desc: ' 🔽',
            }[header.column.getIsSorted() as string] ?? null}
          </div>
        </th>
      ))}
      {/* Empty cells for course columns + Number of CPTs header */}
      {headerGroup.headers.slice(8).map(header => {
        const meta = header.column.columnDef.meta as CourseGroupMeta;
        const courseGroup = meta?.courseGroup;

        return (
          <th
            key={header.id}
            className="border border-gray-300 bg-gray-100"
            style={{ backgroundColor: courseGroup?.color || '#F3F4F6' }}
          ></th>
        );
      })}
    </tr>
  );
}
