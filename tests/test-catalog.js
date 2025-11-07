// Test Catalog Manager
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
  console.log('\n🧪 Testing Catalog Manager...\n');
  let testGroupId, testCourseId;

  await test('Create course group', async () => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-group-1', name: 'Test Group 1', color: '#FF5733', order: 999, courses: [] })
    });
    if (!response.ok) throw new Error('Failed');
    testGroupId = (await response.json()).id;
  });

  await test('Update course group', async () => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups/${testGroupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Test Group', color: '#00FF00' })
    });
    if (!response.ok) throw new Error('Failed');
  });

  await test('Create course', async () => {
    const response = await fetch(`${API_BASE}/catalog/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test-course-1', label: 'Test Course', group: testGroupId, isCPT: false })
    });
    if (!response.ok) throw new Error('Failed');
    testCourseId = (await response.json()).id;
  });

  await test('Update course', async () => {
    const response = await fetch(`${API_BASE}/catalog/courses/${testCourseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Updated Course', isCPT: true })
    });
    if (!response.ok) throw new Error('Failed');
  });

  await test('Protected delete (should fail)', async () => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups/${testGroupId}`, { method: 'DELETE' });
    if (response.ok) throw new Error('Should have failed');
  });

  await test('Delete course', async () => {
    const response = await fetch(`${API_BASE}/catalog/courses/${testCourseId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed');
  });

  await test('Delete course group', async () => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups/${testGroupId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed');
  });

  await test('Validation - invalid color', async () => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'invalid', name: 'Test', color: 'invalid', order: 1, courses: [] })
    });
    if (response.ok) throw new Error('Should have failed');
  });

  await test('Validation - duplicate ID', async () => {
    await fetch(`${API_BASE}/catalog/courseGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'dup', name: 'First', color: '#FF0000', order: 1, courses: [] })
    });
    const response = await fetch(`${API_BASE}/catalog/courseGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'dup', name: 'Second', color: '#00FF00', order: 2, courses: [] })
    });
    if (response.ok) throw new Error('Should have failed');
    await fetch(`${API_BASE}/catalog/courseGroups/dup`, { method: 'DELETE' });
  });

  console.log('\n✨ Catalog Tests Complete!\n');
}

runTests().catch(console.error);

