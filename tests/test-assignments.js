// Test Assignments Editor Functionality
const API_BASE = 'http://localhost:3001';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error.message);
  }
}

async function runTests() {
  console.log('\n🧪 Testing Assignments Editor...\n');

  let testTeacherId;

  // Test 1: Create teacher with assignments
  await test('Create teacher with multiple assignments', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Assignments Test Teacher',
        division: 'MS',
        maxLoad: 18,
        preps: 2,
        students: 75,
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 6,
            isPrepCourse: false,
            isCPT: false,
            students: 25
          },
          {
            courseId: 'CCW7_CCW7',
            courseName: 'CCW7',
            courseGroup: 'CCW7',
            load: 9,
            isPrepCourse: false,
            isCPT: false,
            students: 30
          },
          {
            courseId: 'CCW8_CCW8',
            courseName: 'CCW8',
            courseGroup: 'CCW8',
            load: 0,
            isPrepCourse: false,
            isCPT: true,
            students: 20
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const teacher = await response.json();
    testTeacherId = teacher.id;

    if (teacher.assignments.length !== 3) {
      throw new Error(`Expected 3 assignments, got ${teacher.assignments.length}`);
    }
  });

  // Test 2: Update teacher - add new assignment
  await test('Update teacher - add assignment', async () => {
    const response = await fetch(`${API_BASE}/teachers/${testTeacherId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 6,
            isPrepCourse: false,
            isCPT: false,
            students: 25
          },
          {
            courseId: 'CCW7_CCW7',
            courseName: 'CCW7',
            courseGroup: 'CCW7',
            load: 9,
            isPrepCourse: false,
            isCPT: false,
            students: 30
          },
          {
            courseId: 'CCW8_CCW8',
            courseName: 'CCW8',
            courseGroup: 'CCW8',
            load: 0,
            isPrepCourse: false,
            isCPT: true,
            students: 20
          },
          {
            courseId: 'CCW9_CCW9',
            courseName: 'CCW9',
            courseGroup: 'CCW9',
            load: 3,
            isPrepCourse: false,
            isCPT: false,
            students: 18
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const teacher = await response.json();
    if (teacher.assignments.length !== 4) {
      throw new Error(`Expected 4 assignments, got ${teacher.assignments.length}`);
    }
  });

  // Test 3: Update teacher - remove assignment
  await test('Update teacher - remove assignment', async () => {
    const response = await fetch(`${API_BASE}/teachers/${testTeacherId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 6,
            isPrepCourse: false,
            isCPT: false,
            students: 25
          },
          {
            courseId: 'CCW7_CCW7',
            courseName: 'CCW7',
            courseGroup: 'CCW7',
            load: 9,
            isPrepCourse: false,
            isCPT: false,
            students: 30
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const teacher = await response.json();
    if (teacher.assignments.length !== 2) {
      throw new Error(`Expected 2 assignments, got ${teacher.assignments.length}`);
    }
  });

  // Test 4: Update assignment load
  await test('Update assignment - change load', async () => {
    const response = await fetch(`${API_BASE}/teachers/${testTeacherId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 8, // Changed from 6 to 8
            isPrepCourse: false,
            isCPT: false,
            students: 25
          },
          {
            courseId: 'CCW7_CCW7',
            courseName: 'CCW7',
            courseGroup: 'CCW7',
            load: 9,
            isPrepCourse: false,
            isCPT: false,
            students: 30
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const teacher = await response.json();
    const ccw6Assignment = teacher.assignments.find(a => a.courseId === 'CCW6_CCW6');
    if (ccw6Assignment.load !== 8) {
      throw new Error(`Expected load 8, got ${ccw6Assignment.load}`);
    }
  });

  // Test 5: Validate load exceeds maxLoad (should fail)
  await test('Validate load exceeds maxLoad (should fail)', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Over Capacity Teacher',
        division: 'HS',
        maxLoad: 10,
        preps: 0,
        students: 50,
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 15, // Exceeds maxLoad of 10
            isPrepCourse: false,
            isCPT: false,
            students: 50
          }
        ]
      })
    });

    if (response.ok) {
      throw new Error('Should have failed validation');
    }

    const error = await response.json();
    if (!error.errors || !error.errors.some(e => e.field === 'assignments')) {
      throw new Error('Should have assignments error');
    }
  });

  // Test 6: CPT assignment doesn't count toward load
  await test('CPT assignment does not count toward load', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'CPT Test Teacher',
        division: 'HS',
        maxLoad: 10,
        preps: 1,
        students: 50,
        assignments: [
          {
            courseId: 'CCW6_CCW6',
            courseName: 'CCW6',
            courseGroup: 'CCW6',
            load: 10, // Exactly maxLoad
            isPrepCourse: false,
            isCPT: false,
            students: 30
          },
          {
            courseId: 'TOK_TOK',
            courseName: 'TOK',
            courseGroup: 'TOK',
            load: 5, // CPT, so doesn't count
            isPrepCourse: false,
            isCPT: true,
            students: 20
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Should not fail: ${JSON.stringify(error)}`);
    }

    const teacher = await response.json();
    // Clean up
    await fetch(`${API_BASE}/teachers/${teacher.id}`, { method: 'DELETE' });
  });

  // Cleanup
  await test('Cleanup - delete test teacher', async () => {
    await fetch(`${API_BASE}/teachers/${testTeacherId}`, { method: 'DELETE' });
  });

  console.log('\n✨ Assignments Editor Tests Complete!\n');
}

runTests().catch(console.error);
