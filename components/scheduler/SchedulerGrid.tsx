'use client';

import { useMemo, useState, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  Row,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Teacher, CourseGroup, DivisionConfig, Assignment } from '@/types/scheduler';
import { usePersistedSchedulerState } from '@/hooks/usePersistedSchedulerState';
import { getDivisionColor } from '@/utils/colors';
import AssignmentCell from './AssignmentCell';
import { InlineEditableNumber } from './InlineEditableNumber';
import { teacherApi, toast, ApiError } from '@/lib/api-client';
import clsx from 'clsx';
import { useSummaryCalculations } from './hooks/useSummaryCalculations';
import CourseHeaderRow from './header/CourseHeaderRow';
import SummaryMetricsRows from './header/SummaryMetricsRows';
import TotalsRow from './header/TotalsRow';
import StaticHeadersRow from './header/StaticHeadersRow';
import { parseCourseNameFromColumnId } from './utils/courseNameParser';

interface SchedulerGridProps {
  teachers: Teacher[];
  courseGroups: CourseGroup[];
  divisions: DivisionConfig[];
  onAssignmentUpdate: (
    teacherId: string,
    assignments: Assignment[],
    additionalUpdates?: Array<{ teacherId: string; assignments: Assignment[] }>
  ) => void;
  onEditTeacher?: (teacher: Teacher) => void;
  onDeleteTeacher?: (teacher: Teacher) => void;
  onTeacherUpdate?: () => void; // Callback to refresh teacher data
}

export default function SchedulerGrid({
  teachers,
  courseGroups,
  divisions,
  onAssignmentUpdate,
  onEditTeacher,
  onDeleteTeacher,
  onTeacherUpdate,
}: SchedulerGridProps) {
  const { state, toggleCourseGroup, toggleDivision, setPrepsThreshold } = usePersistedSchedulerState();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  // Handle inline field updates (only maxLoad is editable)
  const handleInlineUpdate = async (teacherId: string, field: 'maxLoad', value: number) => {
    try {
      await teacherApi.update(teacherId, { [field]: value });
      toast.success('Updated', `Max Load updated successfully`);
      onTeacherUpdate?.(); // This will refetch data and recalculate Available
    } catch (error) {
      const err = error as ApiError;
      toast.error('Update failed', err.message);
      throw error;
    }
  };

  // Filter teachers based on collapsed divisions
  const visibleTeachers = useMemo(() => {
    return teachers.filter(
      teacher => !state.collapsedDivisions.includes(teacher.division)
    );
  }, [teachers, state.collapsedDivisions]);

  // Calculate totals for summary row using custom hook
  const summaryTotals = useSummaryCalculations(
    visibleTeachers,
    courseGroups,
    state.collapsedCourseGroups
  );

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { assignment } = event.active.data.current as { assignment: Assignment };
    setActiveAssignment(assignment);
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    setActiveAssignment(null);

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const dragData = active.data.current as {
      assignment: Assignment;
      teacherId: string;
      courseGroup: string;
    };

    const dropData = over.data.current as {
      teacherId: string;
      courseGroup: string;
      courseName: string;
    };

    // Only allow drops within the same course group
    if (dragData.courseGroup !== dropData.courseGroup) {
      toast.error('Invalid drop', 'Cannot drop assignment to a different course group');
      return;
    }

    // Get the source and target teachers
    const sourceTeacher = teachers.find(t => t.id === dragData.teacherId);
    const targetTeacher = teachers.find(t => t.id === dropData.teacherId);

    if (!sourceTeacher || !targetTeacher) return;

    // Don't allow dropping on the same cell
    if (
      dragData.teacherId === dropData.teacherId &&
      dragData.assignment.courseName === dropData.courseName
    ) {
      return;
    }

    // VALIDATION: Check if target teacher has enough available periods
    // Only validate if moving to a different teacher
    // COMMENTED OUT: Allow exceeding max load
    // if (dragData.teacherId !== dropData.teacherId) {
    //   const draggedLoad = dragData.assignment.isCPT
    //     ? 0
    //     : dragData.assignment.load;

    //   // Calculate target teacher's current load (excluding CPT courses)
    //   const targetCurrentLoad = targetTeacher.assignments
    //     .filter(a => !a.isCPT)
    //     .reduce((sum, a) => sum + a.load, 0);

    //   const targetAvailablePeriods = targetTeacher.maxLoad - targetCurrentLoad;

    //   // Check if adding this assignment would exceed maxLoad
    //   if (draggedLoad > targetAvailablePeriods) {
    //     toast.error(
    //       'Cannot assign course',
    //       `${targetTeacher.name} has ${targetAvailablePeriods} periods available, but this course requires ${draggedLoad} periods. Total load cannot exceed max load of ${targetTeacher.maxLoad}.`
    //     );
    //     return;
    //   }
    // }

    // Remove assignment from source teacher
    const updatedSourceAssignments = sourceTeacher.assignments.filter(
      a => !(a.courseId === dragData.assignment.courseId)
    );

    // Update source teacher
    if (dragData.teacherId === dropData.teacherId) {
      // Same teacher, just update the course name
      const updatedAssignment = {
        ...dragData.assignment,
        courseName: dropData.courseName,
      };
      onAssignmentUpdate(sourceTeacher.id, [
        ...updatedSourceAssignments,
        updatedAssignment,
      ]);
    } else {
      // Different teacher, move assignment
      // Update both source and target teachers in a single call
      const updatedTargetAssignments = [
        ...targetTeacher.assignments,
        {
          ...dragData.assignment,
          courseName: dropData.courseName,
        },
      ];

      onAssignmentUpdate(
        sourceTeacher.id,
        updatedSourceAssignments,
        [{ teacherId: targetTeacher.id, assignments: updatedTargetAssignments }]
      );
    }
  }

  // Define static columns
  const staticColumns = useMemo<ColumnDef<Teacher>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Teacher',
      size: 200,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'division',
      header: 'Division',
      size: 80,
      cell: ({ row }) => (
        <div className={clsx(
          'rounded px-2 py-1 text-center text-xs font-semibold',
          row.original.division === 'MS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        )}>
          {row.original.division}
        </div>
      ),
    },
    {
      accessorKey: 'otherRole',
      header: 'Other Role',
      size: 150,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.original.otherRole || '-'}</div>
      ),
    },
    {
      accessorKey: 'maxLoad',
      header: 'Max Load',
      size: 80,
      cell: ({ row }) => (
        <InlineEditableNumber
          value={row.original.maxLoad}
          onSave={(value) => handleInlineUpdate(row.original.id, 'maxLoad', value)}
          min={0}
          max={40}
          className="font-medium"
        />
      ),
    },
    {
      accessorKey: 'availablePeriods',
      header: 'Available',
      size: 100,
      cell: ({ row }) => {
        const available = row.original.availablePeriods || 0;
        return (
          <div className={clsx(
            'text-center font-bold',
            available > 0 ? 'text-green-600' : available < 0 ? 'text-red-600' : 'text-gray-900'
          )}>
            {available}
          </div>
        );
      },
    },
    {
      accessorKey: 'preps',
      header: 'Preps',
      size: 80,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.preps}
        </div>
      ),
    },
    {
      accessorKey: 'students',
      header: 'Students',
      size: 80,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.students}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {onEditTeacher && (
            <button
              onClick={() => onEditTeacher(row.original)}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Edit teacher"
            >
              Edit
            </button>
          )}
          {onDeleteTeacher && (
            <button
              onClick={() => onDeleteTeacher(row.original)}
              className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="Delete teacher"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ], [onEditTeacher, onDeleteTeacher]);

  // Define dynamic course columns with drag-and-drop
  const courseColumns = useMemo<ColumnDef<Teacher>[]>(() => {
    const filteredGroups = courseGroups.filter(group => !state?.collapsedCourseGroups.includes(group?.id));

    return filteredGroups
      .flatMap(group => {
        // Use columns (or fall back to courses for backward compatibility)
        const columnList = group?.columns || group?.courses || [];

        const cols = columnList.map((columnId: string) => {
          const courseName = parseCourseNameFromColumnId(columnId, group.id);
          // Add (OS) suffix for courses in OTHER_SUBJECTS group
          const displayName = group.id === 'OTHER_SUBJECTS' ? `${courseName} (OS)` : courseName;

          return {
            id: `course-${group.id}-${columnId}`,
            header: displayName,
            size: 60,
            meta: {
              courseGroup: group,
            },
            cell: ({ row }: { row: Row<Teacher> }) => {
              const teacher = row.original;
              const assignment = teacher.assignments.find(
                a => a.courseName === courseName && a.courseGroup === group.id
              );

              return (
                <AssignmentCell
                  teacherId={teacher.id}
                  assignment={assignment || null}
                  courseGroup={group}
                  courseName={courseName}
                />
              );
            },
          };
        });
        return cols;
      });
  }, [courseGroups, state.collapsedCourseGroups]);

  // Define "Number of CPTs" column (absolute last column)
  const numberOfCPTsColumn = useMemo<ColumnDef<Teacher>>(() => ({
    id: 'numberOfCPTs',
    header: 'Number of CPTs',
    size: 120,
    meta: {
      isNumberOfCPTs: true, // Flag for special background handling
    },
    cell: ({ row }) => {
      const teacher = row.original;
      // Count of CPT courses
      const cptCount = teacher.assignments?.filter(a => a.isCPT).length || 0;
      const threshold = state.prepsThreshold || 3;
      const isOverThreshold = cptCount > threshold;

      return (
        <div
          className="text-center font-bold"
          title={`Threshold: ${threshold} | CPT Count: ${cptCount}`}
          data-is-over-threshold={isOverThreshold} // Store state for td styling
        >
          {cptCount}
        </div>
      );
    },
  }), [state.prepsThreshold]);

  // Combine all columns: static columns → course columns → Number of CPTs (last)
  const compact = <T,>(arr: (T | null | undefined | false)[]): T[] =>
    arr.filter(Boolean) as T[]

  const columns = useMemo<ColumnDef<any, unknown>[]>(() => {
    return compact([...(staticColumns ?? []), ...(courseColumns ?? []), numberOfCPTsColumn]);
  }, [staticColumns, courseColumns, numberOfCPTsColumn])

  // Initialize TanStack Table
  const table = useReactTable({
    data: visibleTeachers,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Virtualization setup
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Division toggles */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Divisions:</span>
          {divisions.map(div => (
            <button
              key={div.division}
              onClick={() => toggleDivision(div.division)}
              className={clsx(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                state.collapsedDivisions.includes(div.division)
                  ? 'bg-gray-200 text-gray-500'
                  : div.division === 'MS'
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
              )}
            >
              {div.label} ({teachers.filter(t => t.division === div.division).length})
            </button>
          ))}

          <div className="ml-auto flex items-center gap-4">
            {/* CPT Threshold Setting */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">CPT Threshold:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={state.prepsThreshold || 3}
                onChange={(e) => setPrepsThreshold(parseInt(e.target.value) || 3)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Set threshold for CPT count. Red if exceeds, green otherwise."
              />
            </div>

            <span className="text-sm font-medium text-gray-700">Course Groups:</span>
            {courseGroups.map(group => (
              <button
                key={group.id}
                onClick={() => toggleCourseGroup(group.id)}
                className="rounded-md px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: state.collapsedCourseGroups.includes(group.id) ? '#E0E0E0' : group.color,
                  color: '#000',
                }}
              >
                {group?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          ref={tableContainerRef}
          className="relative overflow-auto"
          style={{ height: 'calc(100vh - 280px)' }}
        >
          <table className="w-full border-collapse">

            <thead className="sticky top-0 z-10 bg-gray-100">
              {/* Row 1: Course Headers */}
              <CourseHeaderRow
                headerGroup={table.getHeaderGroups()[0]}
                isSummaryExpanded={isSummaryExpanded}
                onToggleExpand={() => setIsSummaryExpanded(!isSummaryExpanded)}
              />

              {/* Rows 2-7: Summary Metrics (Collapsible) */}
              {isSummaryExpanded && (
                <SummaryMetricsRows
                  headerGroup={table.getHeaderGroups()[0]}
                  summaryTotals={summaryTotals}
                />
              )}

              {/* TOTALS Row (Always visible) */}
              <TotalsRow
                headerGroup={table.getHeaderGroups()[0]}
                visibleTeachers={visibleTeachers}
                summaryTotals={summaryTotals}
              />

              {/* Row 8: Static Column Headers (Sortable) */}
              <StaticHeadersRow headerGroup={table.getHeaderGroups()[0]} />
            </thead>

            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {virtualRows.map(virtualRow => {
                const row = table.getRowModel().rows[virtualRow.index];
                const teacher = row.original;
                const divisionBgColor = getDivisionColor(teacher.division);

                return (
                  <tr key={row.id} className="hover:opacity-90">
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as { courseGroup?: CourseGroup; isNumberOfCPTs?: boolean };
                      const isCourseCell = !!meta?.courseGroup;
                      const isNumberOfCPTsCell = !!meta?.isNumberOfCPTs;
                      const courseGroupColor = meta?.courseGroup?.color;

                      // Calculate background color for Number of CPTs column
                      let cellBgColor = divisionBgColor;
                      let cellTextColor = '';

                      if (isCourseCell) {
                        cellBgColor = courseGroupColor || 'transparent';
                      } else if (isNumberOfCPTsCell) {
                        const teacher = row.original;
                        const cptCount = teacher.assignments?.filter((a: Assignment) => a.isCPT).length || 0;
                        const threshold = state.prepsThreshold || 3;
                        const isOverThreshold = cptCount > threshold;

                        cellBgColor = isOverThreshold ? '#FEE2E2' : '#DCFCE7'; // red-100 : green-100
                        cellTextColor = isOverThreshold ? '#991B1B' : '#166534'; // red-800 : green-800
                      }

                      return (
                        <td
                          key={cell.id}
                          className="border border-gray-300 px-2 py-2 text-sm"
                          style={{
                            backgroundColor: cellBgColor,
                            color: cellTextColor || undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer stats */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Showing {visibleTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAssignment ? (
          <div
            className="flex items-center justify-center rounded px-3 py-2 font-semibold shadow-lg"
            style={{
              backgroundColor: courseGroups.find(g => g.id === activeAssignment.courseGroup)?.color || '#E0E0E0',
            }}
          >
            {activeAssignment.load}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
