import { NextResponse } from 'next/server';
import * as db from '@/lib/db-operations';

export async function GET() {
  try {
    const clients = await db.getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to get clients:', error);
    return NextResponse.json({ error: 'Failed to get clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await db.createClient(body);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
