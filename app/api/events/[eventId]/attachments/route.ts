import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/events/[eventId]/attachments
// Lists all attachments for a given event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  let conn;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { eventId } = await params;
    conn = await getConnection();

    const [attachments] = await conn.execute(
      `SELECT id, event_id, file_url, file_name, file_type, uploaded_by_user_id, created_at
       FROM event_attachments
       WHERE event_id = ?
       ORDER BY created_at DESC`,
      [eventId]
    );

    return NextResponse.json({ attachments: attachments || [] });
  } catch (error) {
    console.error('Error fetching event attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

// POST /api/events/[eventId]/attachments
// Creates a new attachment record for an event
// Body: { fileUrl: string; fileName: string; fileType: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  let conn;
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const { fileUrl, fileName, fileType } = body;

    if (!fileUrl || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl, fileName, fileType' },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [result] = await conn.execute(
      `INSERT INTO event_attachments (event_id, file_url, file_name, file_type, uploaded_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [eventId, fileUrl, fileName, fileType, decoded.userId]
    );

    // Fetch the newly created record
    const insertId = (result as any).insertId;
    const [newAttachments] = await conn.execute(
      `SELECT id, event_id, file_url, file_name, file_type, uploaded_by_user_id, created_at
       FROM event_attachments
       WHERE id = ?`,
      [insertId]
    );

    return NextResponse.json(
      { attachment: (newAttachments as any[])[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event attachment:', error);
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
