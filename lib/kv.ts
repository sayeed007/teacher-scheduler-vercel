import { kv } from '@vercel/kv';
import type { Teacher, CourseGroup, Course, Division } from '@/types/scheduler';

// KV Keys
const KEYS = {
  TEACHERS: 'scheduler:teachers',
  CATALOG_GROUPS: 'scheduler:catalog:groups',
  CATALOG_COURSES: 'scheduler:catalog:courses',
  DIVISIONS: 'scheduler:divisions',
} as const;

// ==================== Teachers ====================

export async function getAllTeachers(): Promise<Teacher[]> {
  const teachers = await kv.get<Teacher[]>(KEYS.TEACHERS);
  return teachers || [];
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  const teachers = await getAllTeachers();
  return teachers.find(t => t.id === id) || null;
}

export async function createTeacher(teacher: Teacher): Promise<Teacher> {
  const teachers = await getAllTeachers();
  teachers.push(teacher);
  await kv.set(KEYS.TEACHERS, teachers);
  return teacher;
}

export async function updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher | null> {
  const teachers = await getAllTeachers();
  const index = teachers.findIndex(t => t.id === id);

  if (index === -1) return null;

  teachers[index] = { ...teachers[index], ...updates };
  await kv.set(KEYS.TEACHERS, teachers);
  return teachers[index];
}

export async function deleteTeacher(id: string): Promise<boolean> {
  const teachers = await getAllTeachers();
  const filtered = teachers.filter(t => t.id !== id);

  if (filtered.length === teachers.length) return false;

  await kv.set(KEYS.TEACHERS, filtered);
  return true;
}

// ==================== Course Groups ====================

export async function getAllCourseGroups(): Promise<CourseGroup[]> {
  const groups = await kv.get<CourseGroup[]>(KEYS.CATALOG_GROUPS);
  return groups || [];
}

export async function getCourseGroup(id: string): Promise<CourseGroup | null> {
  const groups = await getAllCourseGroups();
  return groups.find(g => g.id === id) || null;
}

export async function createCourseGroup(group: CourseGroup): Promise<CourseGroup> {
  const groups = await getAllCourseGroups();
  groups.push(group);
  await kv.set(KEYS.CATALOG_GROUPS, groups);
  return group;
}

export async function updateCourseGroup(id: string, updates: Partial<CourseGroup>): Promise<CourseGroup | null> {
  const groups = await getAllCourseGroups();
  const index = groups.findIndex(g => g.id === id);

  if (index === -1) return null;

  groups[index] = { ...groups[index], ...updates };
  await kv.set(KEYS.CATALOG_GROUPS, groups);
  return groups[index];
}

export async function deleteCourseGroup(id: string, cascade = false): Promise<boolean> {
  const groups = await getAllCourseGroups();
  const filtered = groups.filter(g => g.id !== id);

  if (filtered.length === groups.length) return false;

  await kv.set(KEYS.CATALOG_GROUPS, filtered);

  // If cascade, also delete related courses
  if (cascade) {
    const courses = await getAllCourses();
    const filteredCourses = courses.filter(c => c.group !== id);
    await kv.set(KEYS.CATALOG_COURSES, filteredCourses);
  }

  return true;
}

// ==================== Courses ====================

export async function getAllCourses(): Promise<Course[]> {
  const courses = await kv.get<Course[]>(KEYS.CATALOG_COURSES);
  return courses || [];
}

export async function getCourse(id: string): Promise<Course | null> {
  const courses = await getAllCourses();
  return courses.find(c => c.id === id) || null;
}

export async function createCourse(course: Course): Promise<Course> {
  const courses = await getAllCourses();
  courses.push(course);
  await kv.set(KEYS.CATALOG_COURSES, courses);
  return course;
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  const courses = await getAllCourses();
  const index = courses.findIndex(c => c.id === id);

  if (index === -1) return null;

  courses[index] = { ...courses[index], ...updates };
  await kv.set(KEYS.CATALOG_COURSES, courses);
  return courses[index];
}

export async function deleteCourse(id: string, force = false): Promise<boolean> {
  const courses = await getAllCourses();
  const filtered = courses.filter(c => c.id !== id);

  if (filtered.length === courses.length) return false;

  await kv.set(KEYS.CATALOG_COURSES, filtered);

  // If force, remove course from all teacher assignments
  if (force) {
    const teachers = await getAllTeachers();
    const updatedTeachers = teachers.map(teacher => ({
      ...teacher,
      assignments: teacher.assignments?.filter(a => a.courseId !== id) || []
    }));
    await kv.set(KEYS.TEACHERS, updatedTeachers);
  }

  return true;
}

// ==================== Divisions ====================

export async function getAllDivisions(): Promise<Division[]> {
  const divisions = await kv.get<Division[]>(KEYS.DIVISIONS);
  return divisions || [];
}

export async function setDivisions(divisions: Division[]): Promise<void> {
  await kv.set(KEYS.DIVISIONS, divisions);
}

// ==================== Catalog (Combined) ====================

export async function getCatalog() {
  const [courseGroups, courses] = await Promise.all([
    getAllCourseGroups(),
    getAllCourses(),
  ]);

  return { courseGroups, courses };
}

// ==================== Seed/Initialize ====================

export async function seedData(data: {
  teachers: Teacher[];
  catalog: { courseGroups: CourseGroup[]; courses: Course[] };
  divisions: Division[];
}) {
  await Promise.all([
    kv.set(KEYS.TEACHERS, data.teachers),
    kv.set(KEYS.CATALOG_GROUPS, data.catalog.courseGroups),
    kv.set(KEYS.CATALOG_COURSES, data.catalog.courses),
    kv.set(KEYS.DIVISIONS, data.divisions),
  ]);
}

export async function clearAllData() {
  await Promise.all([
    kv.del(KEYS.TEACHERS),
    kv.del(KEYS.CATALOG_GROUPS),
    kv.del(KEYS.CATALOG_COURSES),
    kv.del(KEYS.DIVISIONS),
  ]);
}
