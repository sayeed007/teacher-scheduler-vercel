'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, type CourseFormData, generateSlug } from '@/lib/validations/catalog-schema';
import type { CourseGroup } from '@/types/scheduler';
import clsx from 'clsx';
import { Modal } from '../ui/Modal';

interface CourseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => Promise<void>;
  course?: CourseFormData | null;
  courseGroups: CourseGroup[];
  title?: string;
}

export function CourseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  course,
  courseGroups,
  title
}: CourseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [showGroupChangeWarning, setShowGroupChangeWarning] = useState(false);
  const [originalGroup, setOriginalGroup] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      id: '',
      label: '',
      group: '',
      isCPT: false
    }
  });

  const label = watch('label');
  const selectedGroup = watch('group');
  const isEditMode = !!course;

  // Auto-generate ID from label (only in create mode)
  useEffect(() => {
    if (!isEditMode && label && !idManuallyEdited) {
      const slug = generateSlug(label);
      setValue('id', slug, { shouldValidate: true });
    }
  }, [label, isEditMode, idManuallyEdited, setValue]);

  // Show warning when group changes in edit mode
  useEffect(() => {
    if (isEditMode && originalGroup && selectedGroup && selectedGroup !== originalGroup) {
      setShowGroupChangeWarning(true);
    } else {
      setShowGroupChangeWarning(false);
    }
  }, [selectedGroup, originalGroup, isEditMode]);

  // Reset form when dialog opens/closes or course changes
  useEffect(() => {
    if (isOpen) {
      const defaultData = course || {
        id: '',
        label: '',
        group: courseGroups[0]?.id || '',
        isCPT: false
      };
      reset(defaultData);
      setIdManuallyEdited(!!course);
      setOriginalGroup(course?.group || null);
      setShowGroupChangeWarning(false);
    }
  }, [isOpen, course, courseGroups, reset]);

  const onFormSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (course ? 'Edit Course' : 'Add Course')}
      size="md"
      overlayBlur
      overlayOpacity={20}
      className="ring-1 ring-black/5"
      bodyClassName="space-y-4"
    >
      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Label <span className="text-red-500">*</span>
            </label>
            <input
              {...register('label')}
              type="text"
              className={clsx(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.label ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="e.g., CCW 6"
            />
            {errors.label && (
              <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
            )}
          </div>

          {/* ID (Slug) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course ID <span className="text-red-500">*</span>
              {!isEditMode && <span className="text-xs text-gray-500 ml-2">(auto-generated)</span>}
            </label>
            <input
              {...register('id')}
              type="text"
              disabled={isEditMode}
              onChange={(e) => {
                setIdManuallyEdited(true);
                register('id').onChange(e);
              }}
              className={clsx(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.id ? 'border-red-500' : 'border-gray-300',
                isEditMode && 'bg-gray-50 cursor-not-allowed'
              )}
              placeholder="e.g., ccw-6"
            />
            {errors.id && (
              <p className="mt-1 text-sm text-red-600">{errors.id.message}</p>
            )}
            {!isEditMode && (
              <p className="mt-1 text-xs text-gray-500">
                Letters, numbers, hyphens, and underscores only. Immutable after creation.
              </p>
            )}
          </div>

          {/* Course Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Group <span className="text-red-500">*</span>
            </label>
            <select
              {...register('group')}
              className={clsx(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.group ? 'border-red-500' : 'border-gray-300'
              )}
            >
              <option value="">Select a group...</option>
              {courseGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.group && (
              <p className="mt-1 text-sm text-red-600">{errors.group.message}</p>
            )}
          </div>

          {/* Group Change Warning */}
          {showGroupChangeWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Changing the group will move this course to a different
                column in the scheduler grid. All teacher assignments will remain intact.
              </p>
            </div>
          )}

          {/* CPT Toggle */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register('isCPT')}
                type="checkbox"
                id="isCPT"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="isCPT" className="text-sm font-medium text-gray-700">
                CPT Course (Common Planning Time)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                CPT courses don't count toward a teacher's load but are tracked for prep time calculations.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After creating a course, it will appear as a column in the
              scheduler grid under its group. Teachers can then be assigned to this course.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
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
            disabled={isSubmitting}
            className={clsx(
              'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
              isSubmitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
