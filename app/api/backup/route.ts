import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { ZipArchive } from 'archiver';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const TABLES = [
  'users',
  'albums',
  'photos',
  'letters',
  'events',
  'attachments',
  'photo_stickers',
  'event_letters',
];

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

    // 1. Get schema (CREATE TABLE statements)
    const schemaStatements: string[] = [];
    for (const table of TABLES) {
      const [rows] = await db.execute(`SHOW CREATE TABLE \`${table}\``);
      if (Array.isArray(rows) && rows.length > 0) {
        const createSQL = (rows[0] as any)['Create Table'];
        if (createSQL) {
          schemaStatements.push(`-- Table: ${table}\n${createSQL};\n`);
        }
      }
    }

    // 2. Get data from all tables
    const data: Record<string, any[]> = {};
    for (const table of TABLES) {
      const [rows] = await db.execute(`SELECT * FROM \`${table}\``);
      data[table] = rows as any[];
    }

    // 3. Prepare backup JSON
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      database: process.env.MYSQL_DATABASE || 'couple_app',
      schema: schemaStatements.join('\n\n'),
      data,
    };

    // 4. Create zip archive
    const archive = new ZipArchive();
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Add schema.sql
    archive.append(backupData.schema, { name: 'schema.sql' });

    // Add data.json
    archive.append(JSON.stringify(backupData, null, 2), { name: 'backup.json' });

    // Add uploads directory
    const uploadsDir = join(process.cwd(), 'storage', 'uploads');
    try {
      const files = await readdir(uploadsDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = join(uploadsDir, file);
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          archive.file(filePath, { name: `uploads/${file}` });
        }
      }
    } catch (err) {
      // uploads directory might not exist or be empty
      console.warn('Could not read uploads directory:', err);
    }

    // Finalize archive
    await archive.finalize();

    // Wait for archive to complete
    const buffer = Buffer.concat(chunks);

    // Generate filename with timestamp
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-cuongvy-${date}.zip`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
