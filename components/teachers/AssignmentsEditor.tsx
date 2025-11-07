'use client';

import { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AssignmentFormData } from '@/lib/validations/teacher-schema';
import clsx from 'clsx';

interface Course {
  id: string;
  label: string;
  group: string;
  isCPT: boolean;
}

interface AssignmentsEditorProps {
  assignments: AssignmentFormData[];
  onChange: (assignments: AssignmentFormData[]) => void;
  maxLoad: number;
  availableCourses: Course[];
}

export function AssignmentsEditor({
  assignments,
  onChange,
  maxLoad,
  availableCourses
}: AssignmentsEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return availableCourses.filter(course =>
      course.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, availableCourses]);

  // Calculate total load
  const totalLoad = useMemo(() => {
    return assignments
      .filter(a => !a.isCPT)
      .reduce((sum, a) => sum + a.load, 0);
  }, [assignments]);

  // Add new assignment
  const handleAddCourse = (course: Course) => {
    const newAssignment: AssignmentFormData = {
      courseId: course.id,
      courseName: course.label,
      courseGroup: course.group,
      load: 0,
      isCPT: course.isCPT,  // Common Planning Time courses
      students: 0
    };

    onChange([...assignments, newAssignment]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Update assignment
  const handleUpdateAssignment = (index: number, updates: Partial<AssignmentFormData>) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  // Delete assignment
  const handleDeleteAssignment = (index: number) => {
    onChange(assignments.filter((_, i) => i !== index));
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = assignments.findIndex((_, i) => `assignment-${i}` === active.id);
      const newIndex = assignments.findIndex((_, i) => `assignment-${i}` === over.id);

      onChange(arrayMove(assignments, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Course */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Course Assignments</h3>
        <div className="text-xs text-gray-500">
          Total Load: <span className={clsx(
            'font-bold',
            totalLoad > maxLoad ? 'text-red-600' : totalLoad === maxLoad ? 'text-gray-900' : 'text-green-600'
          )}>{totalLoad}</span> / {maxLoad}
        </div>
      </div>

      {/* Add Course Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search courses to add..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />

        {/* Dropdown */}
        {showDropdown && filteredCourses.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredCourses.map(course => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleAddCourse(course)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between"
                >
                  <span>
                    <span className="font-medium">{course.label}</span>
                    <span className="text-xs text-gray-500 ml-2">({course.group})</span>
                  </span>
                  {course.isCPT && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      CPT
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200">
          No assignments yet. Search and add courses above.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-2 py-2"></th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Group
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                    Load
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                    CPT
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                    Students
                  </th>
                  <th className="w-16 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <SortableContext
                  items={assignments.map((_, i) => `assignment-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {assignments.map((assignment, index) => (
                    <AssignmentRow
                      key={`assignment-${index}`}
                      id={`assignment-${index}`}
                      assignment={assignment}
                      index={index}
                      onUpdate={handleUpdateAssignment}
                      onDelete={handleDeleteAssignment}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      )}

      {/* Summary */}
      {assignments.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>Total Assignments: {assignments.length}</div>
          <div>CPT Courses: {assignments.filter(a => a.isCPT).length}</div>
          <div>Total Students: {assignments.reduce((sum, a) => sum + (a.students || 0), 0)}</div>
        </div>
      )}
    </div>
  );
}

// Sortable Assignment Row Component
function AssignmentRow({
  id,
  assignment,
  index,
  onUpdate,
  onDelete
}: {
  id: string;
  assignment: AssignmentFormData;
  index: number;
  onUpdate: (index: number, updates: Partial<AssignmentFormData>) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={clsx(
        'hover:bg-gray-50',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <td className="px-2 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
          </svg>
        </button>
      </td>

      {/* Course Name */}
      <td className="px-3 py-2 text-sm font-medium text-gray-900">
        {assignment.courseName}
      </td>

      {/* Group */}
      <td className="px-3 py-2 text-sm text-gray-600">
        {assignment.courseGroup}
      </td>

      {/* Load Input */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          value={assignment.load}
          onChange={(e) => onUpdate(index, { load: parseInt(e.target.value) || 0 })}
          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>

      {/* CPT Toggle */}
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={assignment.isCPT}
          onChange={(e) => onUpdate(index, { isCPT: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>

      {/* Students Input */}
      <td className="px-3 py-2">
        <input
          type="number"
          min="0"
          value={assignment.students || 0}
          onChange={(e) => onUpdate(index, { students: parseInt(e.target.value) || 0 })}
          className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>

      {/* Delete Button */}
      <td className="px-2 py-2 text-center">
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
          title="Delete assignment"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
