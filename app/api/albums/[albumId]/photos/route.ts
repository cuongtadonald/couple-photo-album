import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const { albumId } = await params;
    const connection = await pool.getConnection();
    
    const [photos] = await connection.execute(
      'SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC',
      [albumId]
    );
    connection.release();

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { albumId } = await params;
    const { imageUrl, caption } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // Verify album belongs to user
    const [albums] = await connection.execute(
      'SELECT id FROM albums WHERE id = ? AND user_id = ?',
      [albumId, decoded.userId]
    );

    if ((albums as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const [result] = await connection.execute(
      'INSERT INTO photos (album_id, image_url, caption) VALUES (?, ?, ?)',
      [albumId, imageUrl, caption || null]
    );
    connection.release();

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: (result as any).insertId,
          albumId,
          imageUrl,
          caption,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
