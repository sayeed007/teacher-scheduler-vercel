'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseGroupSchema, type CourseGroupFormData, generateSlug } from '@/lib/validations/catalog-schema';
import { ColorPicker } from '@/components/ui/ColorPicker';
import clsx from 'clsx';
import { Modal } from '../ui/Modal';

interface CourseGroupFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseGroupFormData) => Promise<void>;
  group?: CourseGroupFormData | null;
  title?: string;
}

export function CourseGroupFormDialog({
  isOpen,
  onClose,
  onSubmit,
  group,
  title
}: CourseGroupFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control
  } = useForm<CourseGroupFormData>({
    resolver: zodResolver(courseGroupSchema),
    defaultValues: group || {
      id: '',
      label: '',
      color: '#FBE8A6',
      order: 0,
      columns: []
    }
  });

  const label = watch('label');
  const isEditMode = !!group;

  // Auto-generate ID from label (only in create mode)
  useEffect(() => {
    if (!isEditMode && label && !idManuallyEdited) {
      const slug = generateSlug(label);
      setValue('id', slug, { shouldValidate: true });
    }
  }, [label, isEditMode, idManuallyEdited, setValue]);

  // Reset form when dialog opens/closes or group changes
  useEffect(() => {
    if (isOpen) {
      reset(
        group || {
          id: '',
          label: '',
          color: '#FBE8A6',
          order: 0,
          columns: []
        }
      );
      setIdManuallyEdited(!!group);
    }
  }, [isOpen, group, reset]);

  const onFormSubmit = async (data: CourseGroupFormData) => {
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
      title={title || (group ? 'Edit Course Group' : 'Add Course Group')}
      size="md"
      overlayBlur
      overlayOpacity={20}
      className="ring-1 ring-black/5"
      bodyClassName="space-y-4"
    >
      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Label <span className="text-red-500">*</span>
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
              Group ID <span className="text-red-500">*</span>
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

          {/* Color */}
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                value={field.value}
                onChange={field.onChange}
                label="Color *"
                error={errors.color?.message}
              />
            )}
          />

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order <span className="text-red-500">*</span>
            </label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              className={clsx(
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.order ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="0"
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first in the grid.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Courses will be added to this group when you create or edit them.
              The group will display as a column header in the scheduler grid.
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
            {isSubmitting ? 'Saving...' : group ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
