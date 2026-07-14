import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

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
    
    // Get all events (for a couple, both users can see all events)
    const [events] = await connection.execute(
      `SELECT e.*, u.full_name as created_by_name FROM events e
       JOIN users u ON e.created_by_user_id = u.id
       ORDER BY e.event_date ASC`
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

    const { title, description, eventDate, location } = await request.json();

    if (!title || !eventDate) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO events (title, description, event_date, location, created_by_user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, eventDate, location || null, decoded.userId]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        event: {
          id: (result as any).insertId,
          title,
          description,
          eventDate,
          location,
          createdByUserId: decoded.userId,
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
