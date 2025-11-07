import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses, createCourse } from '@/lib/kv';
import { validateCourse } from '@/lib/api-validation';
import type { Course } from '@/types/scheduler';

export async function GET() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate course data
    const errors = await validateCourse(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const course: Course = {
      ...body,
      id: body.id || `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const created = await createCourse(course);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
