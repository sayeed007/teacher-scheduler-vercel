const fs = require('fs');
const path = require('path');

// Course groups configuration
const COURSE_GROUPS = [
  {
    id: 'CCW6',
    name: 'CCW 6',
    color: '#FDB777',
    order: 1,
    courses: ['CCW6', 'CCW(E)6', 'CCW(E2)6']
  },
  {
    id: 'CCW7',
    name: 'CCW 7',
    color: '#A5D8C7',
    order: 2,
    courses: ['CCW7', 'CCW(E)7']
  },
  {
    id: 'CCW8',
    name: 'CCW 8',
    color: '#F4C2D1',
    order: 3,
    courses: ['CCW8']
  },
  {
    id: 'CCW9',
    name: 'CCW 9',
    color: '#F7E89B',
    order: 4,
    courses: ['CCW9', 'Humanities9', 'World Civilization9']
  },
  {
    id: 'CCW10',
    name: 'CCW 10',
    color: '#A5D8C7',
    order: 5,
    courses: ['CCW10', 'Humanities10', 'World Civilization10']
  },
  {
    id: 'EL1',
    name: 'EL 1',
    color: '#6EAED8',
    order: 6,
    courses: ['EL1', 'Economics EL1', 'Humanities EL1', 'Psychology EL1', 'Technology EL1']
  },
  {
    id: 'EL2',
    name: 'EL 2',
    color: '#8FB897',
    order: 7,
    courses: ['EL2', 'Economics EL2', 'Humanities EL2', 'Geography EL2']
  },
  {
    id: 'ELECTIVES',
    name: 'Electives',
    color: '#7EC8D4',
    order: 8,
    courses: ['History', 'Geography', 'Literature', 'Art', 'Music', 'Drama']
  },
  {
    id: 'OTHER_SUBJECTS',
    name: 'Other Subjects',
    color: '#E8E8E8',
    order: 9999,
    isSystem: true,
    courses: ['Advisory', 'Community Service', 'Independent Study', 'TOK']
  }
];

const DIVISIONS = [
  {
    division: 'MS',
    color: '#E8F5E9',
    label: 'Middle School',
    order: 1
  },
  {
    division: 'HS',
    color: '#FFF9C4',
    label: 'High School',
    order: 2
  }
];

const MS_ROLES = [
  'MS CHN',
  'G8 Drama',
  'Drama',
  'DL + TSET',
  'GLL + TSET',
  null
];

const HS_ROLES = [
  'History',
  'GLL',
  'M + Dorm Head',
  'Tok + BM',
  'Tok + Econ',
  'DPS',
  'Econ + Tok',
  'TSET',
  'NEW',
  'Capstone C',
  'SA + TSET',
  'DL + Tok + ES',
  null
];

const NAME_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function generateTeacherId(index) {
  return `teacher-${String(index).padStart(4, '0')}`;
}

// Generate unique teacher name based on index
function generateTeacherName(index) {
  // Convert index to base-26 (A-Z) name
  let name = '';
  let num = index;

  // Generate 2-3 letter unique names (supports up to 17576 unique names)
  if (num < 26) {
    // Single letter: A, B, C, ...
    name = NAME_PREFIXES[num];
  } else if (num < 702) {
    // Two letters: AA, AB, AC, ..., ZZ
    const first = Math.floor((num - 26) / 26);
    const second = (num - 26) % 26;
    name = NAME_PREFIXES[first] + NAME_PREFIXES[second];
  } else {
    // Three letters: AAA, AAB, ..., ZZZ
    const adjusted = num - 702;
    const first = Math.floor(adjusted / 676);
    const second = Math.floor((adjusted % 676) / 26);
    const third = adjusted % 26;
    name = NAME_PREFIXES[first] + NAME_PREFIXES[second] + NAME_PREFIXES[third];
  }

  return name;
}

function generateAssignments(division, maxLoad) {
  const assignments = [];
  let remainingLoad = maxLoad;

  const availableGroups = division === 'MS'
    ? COURSE_GROUPS.filter(g => ['CCW6', 'CCW7', 'CCW8'].includes(g.id))
    : COURSE_GROUPS.filter(g => !['CCW6', 'CCW7', 'CCW8'].includes(g.id));

  const numAssignments = Math.floor(Math.random() * 4) + 1;

  for (let i = 0; i < numAssignments && remainingLoad > 0; i++) {
    const group = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    const course = group.courses[Math.floor(Math.random() * group.courses.length)];

    const load = Math.min(
      Math.floor(Math.random() * 9) + 2,
      remainingLoad
    );

    const students = Math.floor(Math.random() * 20) + 10;

    assignments.push({
      courseId: `course-${group.id.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`,
      courseName: course,
      courseGroup: group.id,
      load,
      isCPT: Math.random() > 0.8,  // CPT courses don't count toward load
      students
    });

    remainingLoad -= load;
  }

  return assignments;
}

function generateTeacher(index, division) {
  const maxLoad = [15, 18, 21][Math.floor(Math.random() * 3)];
  const assignments = generateAssignments(division, maxLoad);

  const students = assignments.reduce((sum, a) => sum + (a.students || 0), 0);
  const preps = assignments.length;  // Number of distinct subjects/preparations taught

  // Generate unique teacher name based on index
  const name = generateTeacherName(index);

  const roles = division === 'MS' ? MS_ROLES : HS_ROLES;
  const otherRole = roles[Math.floor(Math.random() * roles.length)] || undefined;

  return {
    id: generateTeacherId(index),
    name,
    division,
    otherRole,
    maxLoad,
    preps,
    students,
    assignments
  };
}

function generateMockData(totalTeachers = 1000) {
  const teachers = [];

  const msCount = Math.floor(totalTeachers * 0.4);
  const hsCount = totalTeachers - msCount;

  for (let i = 0; i < msCount; i++) {
    teachers.push(generateTeacher(i, 'MS'));
  }

  for (let i = msCount; i < totalTeachers; i++) {
    teachers.push(generateTeacher(i, 'HS'));
  }

  teachers.sort((a, b) => {
    if (a.division !== b.division) {
      return a.division === 'MS' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Generate courses array from course groups
  const courses = [];
  COURSE_GROUPS.forEach(group => {
    group?.courses?.forEach(courseName => {
      courses.push({
        id: `${group.id}_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        label: courseName,
        group: group.id,
        isCPT: courseName.includes('CPT') // Only courses with 'CPT' in name are CPT courses
      });
    });
  });

  // Calculate columnMetadata for each course group
  const courseGroupsWithMetadata = COURSE_GROUPS.map(g => {
    const columns = g.courses.map(c => `${g.id}_${c.replace(/[^a-zA-Z0-9]/g, '_')}`);

    // Generate column metadata
    const columnMetadata = columns.map(columnId => {
      const courseName = g.courses.find(c => columnId === `${g.id}_${c.replace(/[^a-zA-Z0-9]/g, '_')}`);

      // Calculate totals from teacher assignments
      let totalLoad = 0;
      let totalStudents = 0;
      let assignmentCount = 0;

      teachers.forEach(teacher => {
        teacher.assignments.forEach(assignment => {
          if (assignment.courseGroup === g.id &&
              `${g.id}_${assignment.courseName.replace(/[^a-zA-Z0-9]/g, '_')}` === columnId) {
            totalLoad += assignment.load;
            totalStudents += assignment.students || 0;
            assignmentCount++;
          }
        });
      });

      // Generate reasonable metadata values
      const totalSections = assignmentCount || Math.floor(Math.random() * 3) + 1;
      const periodsPerCycle = totalLoad || (Math.floor(Math.random() * 10) + 8);
      const studentsPerSection = totalStudents > 0 ? Math.round(totalStudents / totalSections) : Math.floor(Math.random() * 10) + 10;
      const remainingPeriod = 0; // Can be customized based on capacity

      return {
        columnId,
        totalSections,
        periodsPerCycle,
        remainingPeriod,
        studentsPerSection
      };
    });

    return {
      id: g.id,
      label: g.name,
      color: g.color,
      order: g.order,
      columns,
      ...(g.isSystem && { isSystem: true }),
      columnMetadata
    };
  });

  return {
    teachers,
    catalog: {
      courseGroups: courseGroupsWithMetadata,
      courses
    },
    divisions: DIVISIONS,
    metadata: {
      totalTeachers: teachers.length,
      lastUpdated: new Date().toISOString()
    }
  };
}

// Generate and save data
const data = generateMockData(10);
const outputPath = path.join(__dirname, '..', 'db.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log(`✅ Generated mock data for ${data.teachers.length} teachers`);
console.log(`📁 Saved to: ${outputPath}`);
console.log(`📊 Course Groups: ${data.catalog.courseGroups.length}`);
console.log(`📚 Courses: ${data.catalog.courses.length}`);
console.log(`🏫 MS Teachers: ${data.teachers.filter(t => t.division === 'MS').length}`);
console.log(`🏫 HS Teachers: ${data.teachers.filter(t => t.division === 'HS').length}`);
