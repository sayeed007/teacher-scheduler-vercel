// Quick API validation tests
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
  console.log('\n🧪 Testing API Endpoints...\n');

  // Test 1: Create teacher with valid data
  await test('POST /teachers - valid data', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-teacher-1',
        name: 'Test Teacher',
        division: 'MS',
        maxLoad: 18,
        preps: 2,
        students: 50,
        assignments: []
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
  });

  // Test 2: Create teacher with invalid maxLoad
  await test('POST /teachers - invalid maxLoad (should fail)', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-teacher-2',
        name: 'Invalid Teacher',
        division: 'MS',
        maxLoad: -5,  // Invalid
        preps: 2,
        students: 50,
        assignments: []
      })
    });

    if (response.ok) {
      throw new Error('Should have failed validation');
    }

    const error = await response.json();
    if (!error.errors || !error.errors.some(e => e.field === 'maxLoad')) {
      throw new Error('Should have maxLoad error');
    }
  });

  // Test 3: Create teacher with load exceeding maxLoad
  await test('POST /teachers - load exceeds maxLoad (should fail)', async () => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-teacher-3',
        name: 'Overloaded Teacher',
        division: 'MS',
        maxLoad: 10,
        preps: 0,
        students: 50,
        assignments: [
          {
            courseId: 'course-1',
            courseName: 'Test Course',
            courseGroup: 'CCW6',
            load: 15,  // Exceeds maxLoad of 10
            isPrepCourse: false
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

  // Test 4: Update teacher
  await test('PATCH /teachers/:id - update valid data', async () => {
    const response = await fetch(`${API_BASE}/teachers/test-teacher-1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxLoad: 21
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
  });

  // Test 5: Get all teachers
  await test('GET /teachers - fetch all', async () => {
    const response = await fetch(`${API_BASE}/teachers`);
    if (!response.ok) throw new Error('Failed to fetch teachers');

    const teachers = await response.json();
    if (!Array.isArray(teachers)) {
      throw new Error('Should return array');
    }
  });

  // Test 6: Get catalog
  await test('GET /catalog - fetch catalog', async () => {
    const response = await fetch(`${API_BASE}/catalog`);
    if (!response.ok) throw new Error('Failed to fetch catalog');

    const catalog = await response.json();
    if (!catalog.courseGroups || !catalog.courses) {
      throw new Error('Catalog should have courseGroups and courses');
    }
  });

  // Cleanup: Delete test teacher
  await test('DELETE /teachers/:id - cleanup', async () => {
    await fetch(`${API_BASE}/teachers/test-teacher-1`, { method: 'DELETE' });
  });

  console.log('\n✨ API Tests Complete!\n');
}

runTests().catch(console.error);
