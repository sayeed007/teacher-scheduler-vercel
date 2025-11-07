'use client';

import { useState, useEffect } from 'react';
import { catalogApi, toast, ApiError } from '@/lib/api-client';
import type { CourseGroup, DeleteReference } from '@/types/scheduler';
import { CourseGroupFormDialog } from './CourseGroupFormDialog';
import { CourseFormDialog } from './CourseFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { CourseGroupFormData, CourseFormData } from '@/lib/validations/catalog-schema';
import clsx from 'clsx';
import { Modal } from '../ui/Modal';

interface CatalogManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Called after any change to refresh the grid
}

type TabType = 'groups' | 'courses';

interface Course {
  id: string;
  label: string;
  group: string;
  isCPT: boolean;
}

export function CatalogManager({ isOpen, onClose, onUpdate }: CatalogManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroupFormData | null>(null);
  const [editingCourse, setEditingCourse] = useState<CourseFormData | null>(null);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'course'; id: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRefs, setDeleteRefs] = useState<DeleteReference[]>([]);

  // Load catalog data
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const catalog = await catalogApi.get();
      setCourseGroups(catalog.courseGroups.sort((a, b) => a.order - b.order));
      setCourses(catalog.courses);
    } catch (error) {
      toast.error('Failed to load catalog');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  // Course Group CRUD
  const handleCreateGroup = async (data: CourseGroupFormData) => {
    try {
      await catalogApi.createGroup(data);
      toast.success('Course group created');
      await loadCatalog();
      onUpdate?.();
      setGroupFormOpen(false);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message || 'Failed to create course group');
      throw error;
    }
  };

  const handleUpdateGroup = async (data: CourseGroupFormData) => {
    try {
      await catalogApi.updateGroup(data.id, data);
      toast.success('Course group updated');
      await loadCatalog();
      onUpdate?.();
      setGroupFormOpen(false);
      setEditingGroup(null);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message || 'Failed to update course group');
      throw error;
    }
  };

  const handleDeleteGroup = async (id: string, cascade: boolean = false) => {
    try {
      await catalogApi.deleteGroup(id, cascade);
      toast.success('Course group deleted');
      await loadCatalog();
      onUpdate?.();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 409) {
        setDeleteError(err.message);
        setDeleteRefs(err.references || []);
        // Keep dialog open for cascade option
      } else {
        toast.error(err.message || 'Failed to delete course group');
        setDeleteConfirmOpen(false);
      }
    }
  };

  // Course CRUD
  const handleCreateCourse = async (data: CourseFormData) => {
    try {
      await catalogApi.createCourse(data);
      toast.success('Course created');
      await loadCatalog();
      onUpdate?.();
      setCourseFormOpen(false);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message || 'Failed to create course');
      throw error;
    }
  };

  const handleUpdateCourse = async (data: CourseFormData) => {
    try {
      await catalogApi.updateCourse(data.id, data);
      toast.success('Course updated');
      await loadCatalog();
      onUpdate?.();
      setCourseFormOpen(false);
      setEditingCourse(null);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message || 'Failed to update course');
      throw error;
    }
  };

  const handleDeleteCourse = async (id: string, force: boolean = false) => {
    try {
      await catalogApi.deleteCourse(id, force);
      toast.success('Course deleted');
      await loadCatalog();
      onUpdate?.();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 409) {
        setDeleteError(err.message);
        setDeleteRefs(err.references || []);
        // Keep dialog open for force option
      } else {
        toast.error(err.message || 'Failed to delete course');
        setDeleteConfirmOpen(false);
      }
    }
  };

  const initiateDelete = (type: 'group' | 'course', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteError(null);
    setDeleteRefs([]);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'group') {
      await handleDeleteGroup(deleteTarget.id, deleteError !== null);
    } else {
      await handleDeleteCourse(deleteTarget.id, deleteError !== null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={'Catalog Manager'}
        size="4xl"
        overlayBlur
        overlayOpacity={20}
        className="ring-1 ring-black/5"
        bodyClassName="space-y-4"
      >
        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'groups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            )}
          >
            Course Groups ({courseGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={clsx(
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            )}
          >
            Courses ({courses.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : activeTab === 'groups' ? (
            <CourseGroupsTab
              groups={courseGroups}
              onAdd={() => {
                setEditingGroup(null);
                setGroupFormOpen(true);
              }}
              onEdit={(group) => {
                setEditingGroup(group);
                setGroupFormOpen(true);
              }}
              onDelete={(id) => initiateDelete('group', id)}
            />
          ) : (
            <CoursesTab
              courses={courses}
              groups={courseGroups}
              onAdd={() => {
                setEditingCourse(null);
                setCourseFormOpen(true);
              }}
              onEdit={(course) => {
                setEditingCourse(course);
                setCourseFormOpen(true);
              }}
              onDelete={(id) => initiateDelete('course', id)}
            />
          )}
        </div>

      </Modal>

      {/* Course Group Form Dialog */}
      <CourseGroupFormDialog
        isOpen={groupFormOpen}
        onClose={() => {
          setGroupFormOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={editingGroup ? handleUpdateGroup : handleCreateGroup}
        group={editingGroup}
      />

      {/* Course Form Dialog */}
      <CourseFormDialog
        isOpen={courseFormOpen}
        onClose={() => {
          setCourseFormOpen(false);
          setEditingCourse(null);
        }}
        onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
        course={editingCourse}
        courseGroups={courseGroups}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'group' ? 'Course Group' : 'Course'}`}
        message={
          deleteError
            ? `${deleteError}\n\n${deleteTarget?.type === 'group'
              ? 'All courses in this group will also be deleted. This action cannot be undone.'
              : 'This course will be removed from all teacher assignments. This action cannot be undone.'}`
            : `Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`
        }
        confirmText={deleteError ? 'Force Delete' : 'Delete'}
        variant="danger"
      />
    </>
  );
}

// Course Groups Tab Component
function CourseGroupsTab({
  groups,
  onAdd,
  onEdit,
  onDelete
}: {
  groups: CourseGroup[];
  onAdd: () => void;
  onEdit: (group: CourseGroup) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Course groups organize courses into columns in the scheduler grid.
        </p>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No course groups yet.</p>
          <p className="text-sm mt-1">Create your first group to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: group.color }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    ID: {group.id} • Order: {group.order}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(group)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(group.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Courses Tab Component
function CoursesTab({
  courses,
  groups,
  onAdd,
  onEdit,
  onDelete
}: {
  courses: Course[];
  groups: CourseGroup[];
  onAdd: () => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}) {
  const getGroupName = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.name || groupId;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Courses appear as columns in the scheduler grid and can be assigned to teachers.
        </p>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No courses yet.</p>
          <p className="text-sm mt-1">Create your first course to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{course.label}</h3>
                  {course.isCPT && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      CPT
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  ID: {course.id} • Group: {getGroupName(course.group)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(course)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(course.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
