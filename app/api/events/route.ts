import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { toMysqlDateTime, isValidDate } from '@/lib/datetime';

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

    const connection = await pool.getConnection();
    // Sự kiện public của mọi người + sự kiện private của chính mình
    const [events] = await connection.execute(
      `SELECT e.*, u.full_name as created_by_name FROM events e
       JOIN users u ON e.created_by_user_id = u.id
       WHERE e.visibility = 'public' OR e.created_by_user_id = ?
       ORDER BY e.event_date ASC`,
      [decoded.userId]
    );
    connection.release();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { title, description, eventDate, location, locationUrl, visibility, coverImageUrl } = await request.json();

    if (!title || !eventDate) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }
    if (!isValidDate(eventDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const vis = visibility === 'public' ? 'public' : 'private';
    const dbDate = toMysqlDateTime(eventDate);

    const connection = await pool.getConnection();
    
    // Ensure cover_image_url column exists
    try {
      await connection.execute('ALTER TABLE events ADD COLUMN cover_image_url TEXT NULL');
    } catch {
      // Column already exists
    }
    
    const [result] = await connection.execute(
      `INSERT INTO events (title, description, event_date, location, location_url, visibility, created_by_user_id, cover_image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, dbDate, location || null, locationUrl || null, vis, decoded.userId, coverImageUrl || null]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        event: {
          id: (result as any).insertId,
          title,
          description,
          event_date: dbDate,
          location,
          location_url: locationUrl || null,
          visibility: vis,
          created_by_user_id: decoded.userId,
          created_by_name: null,
          cover_image_url: coverImageUrl || null,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
