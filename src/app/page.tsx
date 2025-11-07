'use client';

import { useEffect, useState } from 'react';
import { SchedulerData, Teacher, Assignment } from '@/types/scheduler';
import { enhanceTeacherWithMetrics } from '@/lib/calculations';
import SchedulerGrid from '@/components/scheduler/SchedulerGrid';
import { TeacherFormDialog } from '@/components/teachers/TeacherFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { CatalogManager } from '@/components/catalog/CatalogManager';
import { teacherApi, catalogApi, divisionApi, toast, ApiError } from '@/lib/api-client';
import type { TeacherFormData } from '@/lib/validations/teacher-schema';

export default function Home() {
  const [data, setData] = useState<SchedulerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  async function fetchSchedulerData() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from API endpoints
      const [teachers, catalog, divisions] = await Promise.all([
        teacherApi.getAll(),
        catalogApi.get(),
        divisionApi.getAll(),
      ]);

      // Enhance teachers with calculated metrics
      const enhancedTeachers = teachers.map(enhanceTeacherWithMetrics).slice(0, 10);

      setData({
        teachers: enhancedTeachers,
        courseGroups: catalog.courseGroups,
        divisions,
      });
    } catch (err) {
      console.error('Error fetching scheduler data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTeacher(formData: TeacherFormData) {
    try {
      const newTeacher = await teacherApi.create(formData as Omit<Teacher, 'id'>);
      const enhanced = enhanceTeacherWithMetrics(newTeacher);

      // Optimistic update
      setData(prev => prev ? {
        ...prev,
        teachers: [enhanced, ...prev.teachers]
      } : null);

      toast.success('Teacher created successfully', `${newTeacher.name} has been added to the schedule.`);
    } catch (error) {
      const err = error as ApiError;
      toast.error('Failed to create teacher', err.message);
      throw error;
    }
  }

  async function handleUpdateTeacher(formData: TeacherFormData) {
    if (!editingTeacher) return;

    try {
      const updated = await teacherApi.update(editingTeacher.id, formData);
      const enhanced = enhanceTeacherWithMetrics(updated);

      // Optimistic update
      setData(prev => prev ? {
        ...prev,
        teachers: prev.teachers.map(t => t.id === editingTeacher.id ? enhanced : t)
      } : null);

      toast.success('Teacher updated successfully', `${updated.name}'s information has been updated.`);
      setEditingTeacher(null);
    } catch (error) {
      const err = error as ApiError;
      toast.error('Failed to update teacher', err.message);
      throw error;
    }
  }

  async function handleDeleteTeacher() {
    if (!deletingTeacher) return;

    setIsDeleting(true);
    try {
      await teacherApi.delete(deletingTeacher.id);

      // Optimistic update
      setData(prev => prev ? {
        ...prev,
        teachers: prev.teachers.filter(t => t.id !== deletingTeacher.id)
      } : null);

      toast.success('Teacher deleted successfully', `${deletingTeacher.name} has been removed from the schedule.`);
      setDeletingTeacher(null);
    } catch (error) {
      const err = error as ApiError;
      toast.error('Failed to delete teacher', err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAssignmentUpdate(
    teacherId: string,
    assignments: Assignment[],
    additionalUpdates?: Array<{ teacherId: string; assignments: Assignment[] }>
  ) {
    // Optimistic update
    if (data) {
      const updates = new Map<string, Assignment[]>();
      updates.set(teacherId, assignments);

      // Add any additional updates (e.g., when moving between teachers)
      if (additionalUpdates) {
        additionalUpdates.forEach(update => {
          updates.set(update.teacherId, update.assignments);
        });
      }

      const updatedTeachers = data.teachers.map(teacher => {
        const newAssignments = updates.get(teacher.id);
        return newAssignments
          ? enhanceTeacherWithMetrics({ ...teacher, assignments: newAssignments })
          : teacher;
      });

      setData({
        ...data,
        teachers: updatedTeachers,
      });
    }

    // TODO: API call to update teacher assignments
    // await fetch(`http://localhost:3001/teachers/${teacherId}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ assignments })
    // });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-lg text-gray-600">Loading scheduler data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Error Loading Data</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <p className="mb-6 text-sm text-gray-600">
            Make sure the JSON Server is running on port 3001.
            <br />
            Run: <code className="rounded bg-gray-100 px-2 py-1 font-mono">npm run api</code>
          </p>
          <button
            onClick={fetchSchedulerData}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Scheduler - 8-Day Cycle
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Managing {data.teachers.length} teachers across {data.courseGroups.length} course groups
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCatalogManagerOpen(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
              >
                Manage Courses
              </button>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                + Add Teacher
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-6">
        <SchedulerGrid
          teachers={data.teachers}
          courseGroups={data.courseGroups}
          divisions={data.divisions}
          onAssignmentUpdate={handleAssignmentUpdate}
          onEditTeacher={setEditingTeacher}
          onDeleteTeacher={setDeletingTeacher}
          onTeacherUpdate={fetchSchedulerData}
        />
      </main>

      {/* Create Teacher Dialog */}
      <TeacherFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateTeacher}
        title="Add New Teacher"
      />

      {/* Edit Teacher Dialog */}
      <TeacherFormDialog
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSubmit={handleUpdateTeacher}
        teacher={editingTeacher}
        title="Edit Teacher"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher"
        message={`Are you sure you want to delete ${deletingTeacher?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Catalog Manager Dialog */}
      <CatalogManager
        isOpen={isCatalogManagerOpen}
        onClose={() => setIsCatalogManagerOpen(false)}
        onUpdate={fetchSchedulerData}
      />
    </div>
  );
}
