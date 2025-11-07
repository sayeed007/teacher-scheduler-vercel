import type { Teacher, CourseGroup, Course } from '@/types/scheduler';
import { getAllTeachers, getAllCourseGroups, getAllCourses } from './kv';

export interface ValidationError {
  field: string;
  message: string;
  type?: 'warning' | 'error';
}

// ==================== Teacher Validation ====================

export async function validateTeacher(
  teacher: Partial<Teacher>,
  excludeId: string | null = null
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Required fields
  if (!teacher.name || teacher.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!teacher.division || !['MS', 'HS'].includes(teacher.division)) {
    errors.push({ field: 'division', message: 'Division must be MS or HS' });
  }

  // Max load validation
  if (teacher.maxLoad === undefined || teacher.maxLoad === null) {
    errors.push({ field: 'maxLoad', message: 'Max load is required' });
  } else if (typeof teacher.maxLoad !== 'number' || teacher.maxLoad < 0) {
    errors.push({ field: 'maxLoad', message: 'Max load must be a number >= 0' });
  } else if (teacher.maxLoad > 40) {
    errors.push({ field: 'maxLoad', message: 'Max load cannot exceed 40' });
  }

  // Preps validation
  if (teacher.preps !== undefined && (typeof teacher.preps !== 'number' || teacher.preps < 0)) {
    errors.push({ field: 'preps', message: 'Preps must be a number >= 0' });
  }

  // Students validation
  if (teacher.students !== undefined && (typeof teacher.students !== 'number' || teacher.students < 0)) {
    errors.push({ field: 'students', message: 'Students must be a number >= 0' });
  }

  // Assignments validation
  if (teacher.assignments && Array.isArray(teacher.assignments)) {
    teacher.assignments.forEach((assignment, index) => {
      if (typeof assignment.load !== 'number' || assignment.load < 0) {
        errors.push({
          field: `assignments[${index}].load`,
          message: 'Assignment load must be a number >= 0'
        });
      }

      if (!assignment.courseId) {
        errors.push({
          field: `assignments[${index}].courseId`,
          message: 'Course ID is required'
        });
      }

      if (!assignment.courseGroup) {
        errors.push({
          field: `assignments[${index}].courseGroup`,
          message: 'Course group is required'
        });
      }
    });
  }

  // Check for duplicate name (soft warning - not blocking)
  if (teacher.name) {
    const teachers = await getAllTeachers();
    const duplicateName = teachers.find(
      t => t.id !== excludeId && t.name.toLowerCase() === teacher.name!.toLowerCase()
    );

    if (duplicateName) {
      errors.push({
        field: 'name',
        message: `Teacher with name "${teacher.name}" already exists`,
        type: 'warning'
      });
    }
  }

  return errors;
}

// ==================== Course Group Validation ====================

export async function validateCourseGroup(
  group: Partial<CourseGroup>,
  excludeId: string | null = null
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!group.id || group.id.trim() === '') {
    errors.push({ field: 'id', message: 'Group ID is required' });
  }

  if (!group.label || group.label.trim() === '') {
    errors.push({ field: 'label', message: 'Group name is required' });
  }

  if (!group.color || !/^#[0-9A-Fa-f]{6}$/.test(group.color)) {
    errors.push({ field: 'color', message: 'Valid hex color is required (e.g., #FDB777)' });
  }

  if (group.order === undefined || typeof group.order !== 'number') {
    errors.push({ field: 'order', message: 'Order must be a number' });
  }

  // Check for duplicate ID
  if (group.id) {
    const groups = await getAllCourseGroups();
    const duplicateId = groups.find(g => g.id !== excludeId && g.id === group.id);

    if (duplicateId && !excludeId) {
      errors.push({ field: 'id', message: `Course group with ID "${group.id}" already exists` });
    }
  }

  return errors;
}

// ==================== Course Validation ====================

export async function validateCourse(
  course: Partial<Course>,
  excludeId: string | null = null
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!course.id || course.id.trim() === '') {
    errors.push({ field: 'id', message: 'Course ID is required' });
  }

  if (!course.label || course.label.trim() === '') {
    errors.push({ field: 'label', message: 'Course label is required' });
  }

  if (!course.group || course.group.trim() === '') {
    errors.push({ field: 'group', message: 'Course group is required' });
  } else {
    // Verify group exists
    const groups = await getAllCourseGroups();
    const groupExists = groups.find(g => g.id === course.group);
    if (!groupExists) {
      errors.push({ field: 'group', message: `Course group "${course.group}" does not exist` });
    }
  }

  if (course.isCPT !== undefined && typeof course.isCPT !== 'boolean') {
    errors.push({ field: 'isCPT', message: 'isCPT must be a boolean' });
  }

  // Check for duplicate ID
  if (course.id) {
    const courses = await getAllCourses();
    const duplicateId = courses.find(c => c.id !== excludeId && c.id === course.id);

    if (duplicateId && !excludeId) {
      errors.push({ field: 'id', message: `Course with ID "${course.id}" already exists` });
    }
  }

  return errors;
}
