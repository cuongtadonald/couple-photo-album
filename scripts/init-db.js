require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const initDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });

    // Create database
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'couple_app'}`
    );

    // Switch to the database
    await connection.execute(`USE ${process.env.MYSQL_DATABASE || 'couple_app'}`);

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        profile_image_url VARCHAR(500),
        role ENUM('anh', 'em') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create albums table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create photos table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        album_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
      )
    `);

    // Migration: widen caption column for existing databases (VARCHAR(255) -> TEXT)
    try {
      await connection.execute('ALTER TABLE photos MODIFY COLUMN caption TEXT');
    } catch (migrationError) {
      console.warn('Skipping photos.caption migration:', migrationError.message);
    }

    // Create letters table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS letters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_user_id INT,
        title VARCHAR(255) NOT NULL,
        text_content LONGTEXT,
        scheduled_unlock_date DATETIME,
        is_opened BOOLEAN DEFAULT FALSE,
        opened_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create attachments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        letter_id INT,
        event_id INT,
        file_url VARCHAR(500) NOT NULL,
        file_type ENUM('image', 'audio', 'video', 'document') NOT NULL,
        file_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);

    // Create events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATETIME NOT NULL,
        location VARCHAR(255),
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create event_letters table for linking letters to events
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_letters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        letter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE
      )
    `);

    // Insert pre-created accounts
    const bcrypt = require('bcryptjs');
    const hashedPass1 = await bcrypt.hash('281120', 10);
    const hashedPass2 = await bcrypt.hash('090803', 10);

    // Check if users already exist
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      await connection.execute(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        ['cuongtadonald@gmail.com', hashedPass1, 'anh xãa', 'anh']
      );
      
      await connection.execute(
        'INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)',
        ['phuongvy01st@gmail.com', hashedPass2, 'em xãa', 'em']
      );
      
      console.log('Pre-created accounts added successfully!');
    }

    console.log('Database initialized successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
