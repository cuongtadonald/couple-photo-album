import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';

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

    // Upload to Vercel Blob
    const filename = `${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();
    
    const blob = await put(filename, buffer, {
      access: 'private',
    });

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO attachments (letter_id, event_id, file_url, file_type, file_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [letterId || null, eventId || null, blob.url, fileType, file.name]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        attachment: {
          id: (result as any).insertId,
          fileUrl: blob.url,
          fileType,
          fileName: file.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const params: any[] = [];

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
