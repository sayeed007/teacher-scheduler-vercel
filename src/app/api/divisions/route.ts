import { NextResponse } from 'next/server';
import { getAllDivisions } from '@/lib/kv';

export async function GET() {
  try {
    const divisions = await getAllDivisions();
    return NextResponse.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}
