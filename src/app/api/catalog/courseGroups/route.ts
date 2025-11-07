import { NextRequest, NextResponse } from 'next/server';
import { getAllCourseGroups, createCourseGroup } from '@/lib/kv';
import { validateCourseGroup } from '@/lib/api-validation';
import type { CourseGroup } from '@/types/scheduler';

export async function GET() {
  try {
    const groups = await getAllCourseGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching course groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate course group data
    const errors = await validateCourseGroup(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const group: CourseGroup = {
      ...body,
      id: body.id || `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const created = await createCourseGroup(group);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating course group:', error);
    return NextResponse.json(
      { error: 'Failed to create course group' },
      { status: 500 }
    );
  }
}
