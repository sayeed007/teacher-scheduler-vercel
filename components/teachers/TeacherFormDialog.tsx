'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { teacherFormSchema, type TeacherFormData } from '@/lib/validations/teacher-schema';
import type { Teacher } from '@/types/scheduler';
import { AssignmentsEditor } from './AssignmentsEditor';
import { catalogApi } from '@/lib/api-client';
import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';

interface TeacherFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  teacher?: Teacher | null;
  title?: string;
}

export function TeacherFormDialog({
  isOpen,
  onClose,
  onSubmit,
  teacher,
  title
}: TeacherFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string; label: string; group: string; isCPT: boolean }>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: teacher
      ? {
        name: teacher.name,
        division: teacher.division,
        otherRole: teacher.otherRole || '',
        maxLoad: teacher.maxLoad,
        preps: teacher.preps,
        students: teacher.students,
        assignments: teacher.assignments || []
      }
      : {
        name: '',
        division: 'MS',
        otherRole: '',
        maxLoad: 18,
        preps: 0,
        students: 0,
        assignments: []
      }
  });

  // Fetch available courses when open
  useEffect(() => {
    if (!isOpen) return;
    catalogApi.get()
      .then(catalog => setAvailableCourses(catalog.courses))
      .catch(err => console.error('Failed to fetch courses:', err));
  }, [isOpen]);

  // Reset form on open/teacher change
  useEffect(() => {
    if (!isOpen) return;
    reset(
      teacher
        ? {
          name: teacher.name,
          division: teacher.division,
          otherRole: teacher.otherRole || '',
          maxLoad: teacher.maxLoad,
          preps: teacher.preps,
          students: teacher.students,
          assignments: teacher.assignments || []
        }
        : {
          name: '',
          division: 'MS',
          otherRole: '',
          maxLoad: 18,
          preps: 0,
          students: 0,
          assignments: []
        }
    );
  }, [isOpen, teacher, reset]);

  const onFormSubmit = async (data: TeacherFormData) => {
    console.log('Form data being submitted:', data);
    console.log('Form errors:', errors);
    setIsSubmitting(true);
    try {
      // Auto-calculated fields
      const calculatedPreps = data.assignments.length;  // Number of distinct subjects taught
      const calculatedStudents = data.assignments.reduce((sum, a) => sum + (a.students || 0), 0);

      const submissionData = {
        ...data,
        preps: calculatedPreps,
        students: calculatedStudents
      };

      console.log('Submitting data:', submissionData);
      await onSubmit(submissionData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      // Don't close on error - let user see the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxLoad = watch('maxLoad');
  const assignments = watch('assignments');
  const totalLoad = (assignments ?? [])
    .filter(a => !a.isCPT)
    .reduce((sum, a) => sum + a.load, 0);
  const availablePeriods = maxLoad - totalLoad;
  // COMMENTED OUT: Allow exceeding max load
  const isOverCapacity = false; // availablePeriods < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (teacher ? 'Edit Teacher' : 'Add New Teacher')}
      size="2xl"
      overlayBlur
      overlayOpacity={20}
      className="ring-1 ring-black/5"
      bodyClassName="space-y-4"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            className={clsx(
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.name ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="Teacher name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Division */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Division <span className="text-red-500">*</span></label>
          <select
            {...register('division')}
            className={clsx(
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.division ? 'border-red-500' : 'border-gray-300'
            )}
          >
            <option value="MS">Middle School (MS)</option>
            <option value="HS">High School (HS)</option>
          </select>
          {errors.division && <p className="mt-1 text-sm text-red-600">{errors.division.message}</p>}
        </div>

        {/* Other Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Role</label>
          <input
            {...register('otherRole')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Drama, GLL + TSET"
          />
        </div>

        {/* Max Load / Preps / Students */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Load <span className="text-red-500">*</span></label>
            <input
              {...register('maxLoad', { valueAsNumber: true })}
              type="number" min="0" max="40"
              className={clsx(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.maxLoad ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.maxLoad && <p className="mt-1 text-xs text-red-600">{errors.maxLoad.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preps <span className="text-xs text-gray-500">(auto)</span></label>
            <input
              type="number"
              value={assignments?.length || 0}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Students <span className="text-xs text-gray-500">(auto)</span></label>
            <input
              type="number"
              value={assignments?.reduce((sum, a) => sum + (a.students || 0), 0) || 0}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Available Periods */}
        <div className={clsx(
          'border rounded-md p-4',
          isOverCapacity ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Available Periods:</span>
            <span
              className={clsx(
                'text-lg font-bold',
                availablePeriods > 0 ? 'text-green-600'
                  : availablePeriods < 0 ? 'text-red-600'
                    : 'text-gray-900'
              )}
            >
              {availablePeriods}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Max Load: {maxLoad} | Assigned: {totalLoad}
          </div>
          {isOverCapacity && (
            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
              <p className="text-xs text-red-700 font-medium">
                ⚠ Over capacity by {Math.abs(availablePeriods)} periods
              </p>
              <p className="text-xs text-red-600 mt-1">
                Total assigned load ({totalLoad}) cannot exceed max load ({maxLoad}). Please remove or reduce assignments.
              </p>
            </div>
          )}
        </div>

        {/* Assignments */}
        <AssignmentsEditor
          assignments={assignments || []}
          onChange={(newAssignments) => setValue('assignments', newAssignments, { shouldValidate: true })}
          maxLoad={maxLoad}
          availableCourses={availableCourses}
        />

        {/* Global validation errors */}
        {errors.assignments && typeof errors.assignments.message === 'string' && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{errors.assignments.message}</p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-2 flex flex-col gap-2">
          {isOverCapacity && (
            <div className="text-sm text-red-600 font-medium text-right">
              Cannot save: Total load exceeds max load
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverCapacity}
              className={clsx(
                'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                (isSubmitting || isOverCapacity)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
              title={isOverCapacity ? 'Cannot save: Total load exceeds max load' : ''}
            >
              {isSubmitting ? 'Saving...' : teacher ? 'Update Teacher' : 'Create Teacher'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
