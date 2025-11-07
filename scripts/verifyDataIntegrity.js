const fs = require('fs');
const path = require('path');

// Read the generated db.json
const dbPath = path.join(__dirname, '..', 'db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('🔍 Verifying Data Integrity...\n');

let passCount = 0;
let failCount = 0;
const issues = [];

// For each course group and each course
data.catalog.courseGroups.forEach(group => {
  group.columnMetadata.forEach(metadata => {
    const { columnId, totalSections, periodsPerCycle, remainingPeriod, studentsPerSection } = metadata;

    // Calculate total load from teacher assignments
    let calculatedTotalLoad = 0;

    data.teachers.forEach(teacher => {
      teacher.assignments.forEach(assignment => {
        const assignmentColumnId = `${assignment.courseGroup}_${assignment.courseName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (assignmentColumnId === columnId) {
          calculatedTotalLoad += assignment.load;
        }
      });
    });

    // Expected total load from metadata
    const expectedTotalLoad = totalSections * periodsPerCycle;

    // Verify data integrity
    const isLoadCorrect = calculatedTotalLoad === expectedTotalLoad;
    const isRemainingPeriodZero = remainingPeriod === 0;
    const isStudentsInRange = studentsPerSection >= 15 && studentsPerSection <= 30;

    if (isLoadCorrect && isRemainingPeriodZero && isStudentsInRange) {
      passCount++;
      console.log(`✅ ${columnId}`);
      console.log(`   totalSections: ${totalSections}, periodsPerCycle: ${periodsPerCycle}`);
      console.log(`   Product: ${expectedTotalLoad}, Actual Load: ${calculatedTotalLoad}`);
      console.log(`   studentsPerSection: ${studentsPerSection}, remainingPeriod: ${remainingPeriod}\n`);
    } else {
      failCount++;
      const issue = {
        columnId,
        metadata: { totalSections, periodsPerCycle, studentsPerSection, remainingPeriod },
        expectedLoad: expectedTotalLoad,
        actualLoad: calculatedTotalLoad,
        reasons: []
      };

      if (!isLoadCorrect) {
        issue.reasons.push(`Load mismatch: expected ${expectedTotalLoad}, got ${calculatedTotalLoad}`);
      }
      if (!isRemainingPeriodZero) {
        issue.reasons.push(`remainingPeriod should be 0, got ${remainingPeriod}`);
      }
      if (!isStudentsInRange) {
        issue.reasons.push(`studentsPerSection should be 15-30, got ${studentsPerSection}`);
      }

      issues.push(issue);
      console.log(`❌ ${columnId}`);
      issue.reasons.forEach(reason => console.log(`   - ${reason}`));
      console.log();
    }
  });
});

console.log('\n📊 Summary:');
console.log(`   ✅ Passed: ${passCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`   📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%`);

if (failCount > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => {
    console.log(`\n   ${issue.columnId}:`);
    issue.reasons.forEach(reason => console.log(`     - ${reason}`));
  });
  process.exit(1);
} else {
  console.log('\n🎉 All data integrity checks passed!');
  process.exit(0);
}
