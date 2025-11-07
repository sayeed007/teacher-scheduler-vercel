import { NextRequest, NextResponse } from 'next/server';
import { getCourse, updateCourse, deleteCourse, getAllTeachers } from '@/lib/kv';
import { validateCourse } from '@/lib/api-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await getCourse(id);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const course = await getCourse(id);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const updatedCourse = { ...course, ...body };
    const errors = await validateCourse(updatedCourse, id);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updated = await updateCourse(id, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if any teachers have this course in assignments
    const teachers = await getAllTeachers();
    const teachersWithCourse = teachers.filter(t =>
      t.assignments?.some(a => a.courseId === id)
    );

    if (teachersWithCourse.length > 0 && !force) {
      return NextResponse.json(
        {
          error: 'Cannot delete course',
          message: `${teachersWithCourse.length} teacher(s) have this course assigned. Use ?force=true to force delete.`,
          references: teachersWithCourse.map(t => ({ id: t.id, name: t.name }))
        },
        { status: 409 }
      );
    }

    const deleted = await deleteCourse(id, force);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
