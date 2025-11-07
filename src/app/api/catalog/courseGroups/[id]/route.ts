import { NextRequest, NextResponse } from 'next/server';
import { getCourseGroup, updateCourseGroup, deleteCourseGroup, getAllCourses } from '@/lib/kv';
import { validateCourseGroup } from '@/lib/api-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await getCourseGroup(id);

    if (!group) {
      return NextResponse.json(
        { error: 'Course group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching course group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course group' },
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

    const group = await getCourseGroup(id);
    if (!group) {
      return NextResponse.json(
        { error: 'Course group not found' },
        { status: 404 }
      );
    }

    // Prevent changing ID of system course groups
    if (group.isSystem && body.id && body.id !== id) {
      return NextResponse.json(
        {
          error: 'Cannot modify system course group ID',
          message: 'System course groups cannot have their ID changed.'
        },
        { status: 403 }
      );
    }

    const updatedGroup = { ...group, ...body };
    const errors = await validateCourseGroup(updatedGroup, id);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updated = await updateCourseGroup(id, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Course group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating course group:', error);
    return NextResponse.json(
      { error: 'Failed to update course group' },
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
    const cascade = searchParams.get('cascade') === 'true';

    const group = await getCourseGroup(id);
    if (!group) {
      return NextResponse.json(
        { error: 'Course group not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system course groups
    if (group.isSystem) {
      return NextResponse.json(
        {
          error: 'Cannot delete system course group',
          message: 'System course groups (like OTHER_SUBJECTS) cannot be deleted.'
        },
        { status: 403 }
      );
    }

    // Check if any courses reference this group
    const courses = await getAllCourses();
    const referencedCourses = courses.filter(c => c.group === id);

    if (referencedCourses.length > 0 && !cascade) {
      return NextResponse.json(
        {
          error: 'Cannot delete course group',
          message: `${referencedCourses.length} course(s) reference this group. Use ?cascade=true to force delete.`,
          references: referencedCourses.map(c => c.id)
        },
        { status: 409 }
      );
    }

    const deleted = await deleteCourseGroup(id, cascade);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Course group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course group:', error);
    return NextResponse.json(
      { error: 'Failed to delete course group' },
      { status: 500 }
    );
  }
}
