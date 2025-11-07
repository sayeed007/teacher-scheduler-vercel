const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Helper to read current DB state
function readDB() {
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper to write DB state
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Validation middleware
server.use(jsonServer.bodyParser);
server.use(middlewares);

// Custom validation middleware
server.use((req, res, next) => {
  const db = readDB();

  // Teacher validation
  if (req.method === 'POST' && req.path === '/teachers') {
    const errors = validateTeacher(req.body, db);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Add metadata
    req.body.meta = {
      notes: req.body.meta?.notes || '',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  if (req.method === 'PATCH' && req.path.startsWith('/teachers/')) {
    const teacherId = req.path.split('/')[2];
    const teacher = db.teachers.find(t => t.id === teacherId);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const updatedTeacher = { ...teacher, ...req.body };
    const errors = validateTeacher(updatedTeacher, db, teacherId);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Update metadata
    if (!req.body.meta) {
      req.body.meta = teacher.meta || {};
    }
    req.body.meta.updatedAt = new Date().toISOString();
  }

  // Course Group validation
  if (req.method === 'POST' && req.path === '/catalog/courseGroups') {
    const errors = validateCourseGroup(req.body, db);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
  }

  if (req.method === 'PATCH' && req.path.startsWith('/catalog/courseGroups/')) {
    const groupId = req.path.split('/')[3];
    const group = db.catalog?.courseGroups?.find(g => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Course group not found' });
    }

    // Prevent changing ID of system course groups
    if (group?.isSystem && req.body.id && req.body.id !== groupId) {
      return res.status(403).json({
        error: 'Cannot modify system course group ID',
        message: 'System course groups cannot have their ID changed.'
      });
    }

    const updatedGroup = { ...group, ...req.body };
    const errors = validateCourseGroup(updatedGroup, db, groupId);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
  }

  if (req.method === 'DELETE' && req.path.startsWith('/catalog/courseGroups/')) {
    const groupId = req.path.split('/')[3];
    const group = db.catalog?.courseGroups?.find(g => g.id === groupId);

    // Prevent deletion of system course groups
    if (group?.isSystem) {
      return res.status(403).json({
        error: 'Cannot delete system course group',
        message: 'System course groups (like OTHER_SUBJECTS) cannot be deleted.'
      });
    }

    // Check if any courses reference this group
    const referencedCourses = db.catalog?.courses?.filter(c => c.group === groupId) || [];

    if (referencedCourses.length > 0 && req.query.cascade !== 'true') {
      return res.status(409).json({
        error: 'Cannot delete course group',
        message: `${referencedCourses.length} course(s) reference this group. Use ?cascade=true to force delete.`,
        references: referencedCourses.map(c => c.id)
      });
    }
  }

  // Course validation
  if (req.method === 'POST' && req.path === '/catalog/courses') {
    const errors = validateCourse(req.body, db);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
  }

  if (req.method === 'PATCH' && req.path.startsWith('/catalog/courses/')) {
    const courseId = req.path.split('/')[3];
    const course = db.catalog?.courses?.find(c => c.id === courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = { ...course, ...req.body };
    const errors = validateCourse(updatedCourse, db, courseId);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
  }

  if (req.method === 'DELETE' && req.path.startsWith('/catalog/courses/')) {
    const courseId = req.path.split('/')[3];

    // Check if any teachers have this course in assignments
    const teachersWithCourse = db.teachers.filter(t =>
      t.assignments?.some(a => a.courseId === courseId)
    );

    if (teachersWithCourse.length > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        error: 'Cannot delete course',
        message: `${teachersWithCourse.length} teacher(s) have this course assigned. Use ?force=true to force delete.`,
        references: teachersWithCourse.map(t => ({ id: t.id, name: t.name }))
      });
    }

    // If force delete, remove from all teachers
    if (req.query.force === 'true') {
      const updatedDb = readDB();
      updatedDb.teachers = updatedDb.teachers.map(teacher => ({
        ...teacher,
        assignments: teacher.assignments.filter(a => a.courseId !== courseId)
      }));
      writeDB(updatedDb);
    }
  }

  next();
});

// Validation functions
function validateTeacher(teacher, db, excludeId = null) {
  const errors = [];

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

    // Calculate total non-CPT load
    // COMMENTED OUT: Allow exceeding max load
    // const totalLoad = teacher.assignments
    //   .filter(a => !a.isCPT)
    //   .reduce((sum, a) => sum + (a.load || 0), 0);

    // if (totalLoad > teacher.maxLoad) {
    //   errors.push({
    //     field: 'assignments',
    //     message: `Total load (${totalLoad}) exceeds max load (${teacher.maxLoad})`
    //   });
    // }
  }

  // Check for duplicate name (soft warning - not blocking)
  const duplicateName = db.teachers.find(
    t => t.id !== excludeId && t.name.toLowerCase() === teacher.name.toLowerCase()
  );

  if (duplicateName) {
    errors.push({
      field: 'name',
      message: `Teacher with name "${teacher.name}" already exists`,
      type: 'warning'
    });
  }

  return errors;
}

function validateCourseGroup(group, db, excludeId = null) {
  const errors = [];

  if (!group.id || group.id.trim() === '') {
    errors.push({ field: 'id', message: 'Group ID is required' });
  }

  if (!group.name || group.name.trim() === '') {
    errors.push({ field: 'name', message: 'Group name is required' });
  }

  if (!group.color || !/^#[0-9A-Fa-f]{6}$/.test(group.color)) {
    errors.push({ field: 'color', message: 'Valid hex color is required (e.g., #FDB777)' });
  }

  if (group.order === undefined || typeof group.order !== 'number') {
    errors.push({ field: 'order', message: 'Order must be a number' });
  }

  // Check for duplicate ID
  const duplicateId = db.catalog?.courseGroups?.find(
    g => g.id !== excludeId && g.id === group.id
  );

  if (duplicateId && !excludeId) {
    errors.push({ field: 'id', message: `Course group with ID "${group.id}" already exists` });
  }

  return errors;
}

function validateCourse(course, db, excludeId = null) {
  const errors = [];

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
    const groupExists = db.catalog?.courseGroups?.find(g => g.id === course.group);
    if (!groupExists) {
      errors.push({ field: 'group', message: `Course group "${course.group}" does not exist` });
    }
  }

  if (course.isCPT !== undefined && typeof course.isCPT !== 'boolean') {
    errors.push({ field: 'isCPT', message: 'isCPT must be a boolean' });
  }

  // Check for duplicate ID
  const duplicateId = db.catalog?.courses?.find(
    c => c.id !== excludeId && c.id === course.id
  );

  if (duplicateId && !excludeId) {
    errors.push({ field: 'id', message: `Course with ID "${course.id}" already exists` });
  }

  return errors;
}

// Use default router
server.use(router);

server.listen(PORT, () => {
  console.log(`\n🚀 JSON Server is running on http://localhost:${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET    /teachers`);
  console.log(`   POST   /teachers`);
  console.log(`   PATCH  /teachers/:id`);
  console.log(`   DELETE /teachers/:id`);
  console.log(`\n   GET    /catalog`);
  console.log(`   POST   /catalog/courseGroups`);
  console.log(`   PATCH  /catalog/courseGroups/:id`);
  console.log(`   DELETE /catalog/courseGroups/:id`);
  console.log(`\n   POST   /catalog/courses`);
  console.log(`   PATCH  /catalog/courses/:id`);
  console.log(`   DELETE /catalog/courses/:id`);
  console.log(`\n✅ Validation enabled for all mutations`);
  console.log(`\n💾 Database: ${DB_FILE}\n`);
});
