import { NextRequest, NextResponse } from 'next/server';
import { seedData, clearAllData } from '@/lib/kv';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clear = searchParams.get('clear') === 'true';

    // Clear existing data if requested
    if (clear) {
      await clearAllData();
    }

    // Read db.json from the project root
    const dbPath = path.join(process.cwd(), 'db.json');

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'db.json not found. Run "npm run generate-data" first.' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Seed the KV store
    await seedData(data);

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully',
      counts: {
        teachers: data.teachers?.length || 0,
        courseGroups: data.catalog?.courseGroups?.length || 0,
        courses: data.catalog?.courses?.length || 0,
        divisions: data.divisions?.length || 0
      }
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearAllData();
    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
