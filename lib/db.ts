import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'couple_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Run pending column migrations automatically on first use
let migrationsDone = false;
async function runMigrations() {
  if (migrationsDone) return;
  migrationsDone = true;
  const conn = await pool.getConnection();
  const migrations: [string, string][] = [
    ['albums', "ALTER TABLE albums ADD COLUMN visibility ENUM('private','public') NOT NULL DEFAULT 'private'"],
    ['albums', 'ALTER TABLE albums ADD COLUMN cover_photo_id INT'],
    ['albums', 'ALTER TABLE albums ADD COLUMN location_name VARCHAR(255)'],
    ['albums', 'ALTER TABLE albums ADD COLUMN location_url VARCHAR(1000)'],
    ['photos', 'ALTER TABLE photos MODIFY COLUMN caption TEXT'],
    ['photos', 'ALTER TABLE photos ADD COLUMN location_name VARCHAR(255)'],
    ['photos', 'ALTER TABLE photos ADD COLUMN location_url VARCHAR(1000)'],
    ['events', "ALTER TABLE events ADD COLUMN visibility ENUM('private','public') NOT NULL DEFAULT 'private'"],
    ['events', 'ALTER TABLE events ADD COLUMN location_url VARCHAR(1000)'],
  ];
  for (const [, sql] of migrations) {
    try {
      await conn.execute(sql);
    } catch {
      // column already exists or table doesn't exist yet — safe to ignore
    }
  }
  conn.release();
}

// Kick off migrations immediately (fire-and-forget; errors are swallowed above)
runMigrations().catch(() => {});

export default pool;

export const getConnection = async () => {
  await runMigrations();
  return await pool.getConnection();
};
