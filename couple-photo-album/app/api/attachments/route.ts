import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const letterId = formData.get('letterId');
    const eventId = formData.get('eventId');
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!letterId && !eventId) {
      return NextResponse.json(
        { error: 'Either letterId or eventId is required' },
        { status: 400 }
      );
    }

    // Save to local filesystem under storage/uploads/
    const uploadDir = join(process.cwd(), 'storage', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const originalName = file.name || 'file';
    const ext = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : 'bin';
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/api/files/${fileName}`;

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO attachments (letter_id, event_id, file_url, file_type, file_name)
       VALUES (?, ?, ?, ?, ?)`,
      [letterId || null, eventId || null, fileUrl, fileType, originalName]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        attachment: {
          id: (result as any).insertId,
          file_url: fileUrl,
          file_type: fileType,
          file_name: originalName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const letterId = request.nextUrl.searchParams.get('letterId');
    const eventId = request.nextUrl.searchParams.get('eventId');

    let query = 'SELECT * FROM attachments WHERE';
    const params: (string | number)[] = [];

    if (letterId) {
      query += ' letter_id = ?';
      params.push(letterId);
    } else if (eventId) {
      query += ' event_id = ?';
      params.push(eventId);
    } else {
      return NextResponse.json(
        { error: 'Either letterId or eventId is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    const [attachments] = await connection.execute(query, params);
    connection.release();

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const attachmentId = request.nextUrl.searchParams.get('id');
    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM attachments WHERE id = ?', [attachmentId]);
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
