import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clients = await db.getWorkoutSessionClients(params.id);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to get session clients:', error);
    return NextResponse.json({ error: 'Failed to get session clients' }, { status: 500 });
  }
}
