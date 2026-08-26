import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Migration tự động: tạo bảng letter_reactions nếu chưa có
let migrationDone = false;
async function ensureMigration() {
  if (migrationDone) return;
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS letter_reactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        letter_id INT NOT NULL,
        user_id INT NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_letter_user (letter_id, user_id),
        FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (_) { /* bảng đã tồn tại */ }
  conn.release();
  migrationDone = true;
}

// GET /api/letters/[letterId]/reactions - Lấy tất cả reactions của thư
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  await ensureMigration();
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { letterId } = await params;
    const connection = await pool.getConnection();

    const [reactions] = await connection.execute(
      `SELECT lr.*, u.full_name as user_name 
       FROM letter_reactions lr 
       JOIN users u ON lr.user_id = u.id 
       WHERE lr.letter_id = ? 
       ORDER BY lr.created_at ASC`,
      [letterId]
    );

    connection.release();
    return NextResponse.json({ reactions });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/letters/[letterId]/reactions - Thêm hoặc cập nhật reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  await ensureMigration();
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { letterId } = await params;
    const { emoji } = await request.json();

    // Validate emoji
    const validEmojis = ['👍', '❤️', '😆', '😮', '😢', '😡'];
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    // Kiểm tra thư có tồn tại không
    const [letters] = await connection.execute(
      'SELECT id FROM letters WHERE id = ?',
      [letterId]
    );
    if ((letters as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    // Kiểm tra user có phải là người nhận không (không phải chủ thư)
    const [letterDetails] = await connection.execute(
      'SELECT from_user_id FROM letters WHERE id = ?',
      [letterId]
    );
    const letter = (letterDetails as any[])[0];
    if (letter.from_user_id === auth.decoded.userId) {
      connection.release();
      return NextResponse.json(
        { error: 'Bạn không thể react thư của chính mình' },
        { status: 403 }
      );
    }

    // Insert hoặc update reaction (mỗi user chỉ có 1 reaction cho 1 thư)
    await connection.execute(
      `INSERT INTO letter_reactions (letter_id, user_id, emoji) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE emoji = VALUES(emoji)`,
      [letterId, auth.decoded.userId, emoji]
    );

    // Lấy lại reaction vừa thêm/cập nhật
    const [newReaction] = await connection.execute(
      `SELECT lr.*, u.full_name as user_name 
       FROM letter_reactions lr 
       JOIN users u ON lr.user_id = u.id 
       WHERE lr.letter_id = ? AND lr.user_id = ?`,
      [letterId, auth.decoded.userId]
    );

    connection.release();
    return NextResponse.json({ 
      success: true, 
      reaction: (newReaction as any[])[0] 
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/letters/[letterId]/reactions - Xóa reaction của user hiện tại
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  await ensureMigration();
  try {
    const auth = await authorize(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { letterId } = await params;
    const connection = await pool.getConnection();

    await connection.execute(
      'DELETE FROM letter_reactions WHERE letter_id = ? AND user_id = ?',
      [letterId, auth.decoded.userId]
    );

    connection.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function để xác thực
async function authorize(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 as const };
  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Invalid token', status: 401 as const };
  return { decoded };
}
