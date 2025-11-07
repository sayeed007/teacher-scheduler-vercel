import { NextRequest, NextResponse } from 'next/server';
import { getAllTeachers, createTeacher } from '@/lib/kv';
import { validateTeacher } from '@/lib/api-validation';
import type { Teacher } from '@/types/scheduler';

export async function GET() {
  try {
    const teachers = await getAllTeachers();
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate teacher data
    const errors = await validateTeacher(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Generate ID if not provided
    const teacher: Teacher = {
      ...body,
      id: body.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      meta: {
        notes: body.meta?.notes || '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    };

    const created = await createTeacher(teacher);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}
