# 💕 Tình Yêu Của Chúng Ta - Setup Guide

Một ứng dụng web lãng mạn dành cho các cặp đôi chia sẻ kỷ niệm, thư tay, và sự kiện.

## ✨ Tính Năng

- 👥 Hai tài khoản sẵn (Anh Xã & Em Xã) - Đăng nhập bằng passcode
- 📷 Album ảnh kỷ niệm
- 💌 Thư tay với hẹn giờ mở
- 🎙️ Ghi âm giọng nói
- 📎 Đính kèm tệp (ảnh, âm thanh, tài liệu)
- 🗓️ Quản lý sự kiện
- 🔒 Bảo mật JWT

## 🔐 Tài Khoản Mặc Định

Ứng dụng đi kèm với 2 tài khoản sẵn:

| Tài Khoản | Email | Mã Gán |
|-----------|-------|--------|
| 👨 Anh Xã | cuongtadonald@gmail.com | **281120** |
| 👩 Em Xã | phuongvy01st@gmail.com | **090803** |

**Đăng nhập:** Nhập 6 số mã gán, mỗi ô 1 số, rồi nhấn "💗 Vào"

## 📋 Yêu Cầu

1. **MySQL Database** - Máy chủ MySQL cục bộ hoặc từ xa
2. **Vercel Blob Token** - Để lưu trữ tệp (tùy chọn, khuyên dùng cho production)
3. **Node.js & pnpm** - Runtime và package manager

## 🚀 Cài Đặt & Khởi Động

### 1. Vào Thư Mục Dự Án

```bash
cd my-project
```

### 2. Cài Đặt Dependencies

Dependencies đã được cài, nhưng nếu cần:

```bash
pnpm install
```

### 3. Cấu Hình Database

Cập nhật file `.env.local` với thông tin MySQL của bạn:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=couple_app
JWT_SECRET=your_secret_key_here
```

### 4. Khởi Tạo Database

```bash
# Tạo database và thêm 2 tài khoản sẵn
node scripts/init-db.js
```

Script sẽ:
- ✅ Tạo database `couple_app`
- ✅ Tạo tất cả các bảng cần thiết
- ✅ Thêm 2 tài khoản (Anh Xã & Em Xã)

Update `.env.local` with your database credentials.

### 4. Configure Environment Variables

Edit `.env.local` and update:

```env
# MySQL Configuration
MYSQL_HOST=localhost           # Your database host
MYSQL_USER=root                # Your MySQL username
MYSQL_PASSWORD=yourpassword    # Your MySQL password
MYSQL_DATABASE=couple_app      # Database name

# JWT Secret (Change this!)
JWT_SECRET=your-secret-key-change-this-in-production

# Vercel Blob (Optional - for file uploads)
VERCEL_BLOB_TOKEN=your-blob-token-here
```

### 5. Initialize the Database

Run the initialization script to create all tables:

```bash
node scripts/init-db.js
```

You should see: "Database initialized successfully!"

### 6. Start the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## First Time Usage

1. **Navigate to the App**: Open `http://localhost:3000` in your browser
2. **You'll be redirected to login page** - Click "Đăng ký" (Register) to create accounts
3. **Create Two Accounts**:
   - First account: Role = "Anh xã" (Brother/Husband)
   - Second account: Role = "Em xã" (Sister/Wife)
4. **Start Using**:
   - Create albums for photos
   - Write love letters with optional scheduled unlock times
   - Record voice messages
   - Create upcoming events

## Features Explanation

### Albums & Photos

- Create multiple albums to organize memories
- Add photos with URLs (can use Imgur, Cloudinary, or any image hosting)
- Add captions to remember special moments
- View gallery-style photo display

### Love Letters

- Write heartfelt letters with rich text
- Schedule letters to unlock on a specific date/time
- Letters are locked until the scheduled time (client-side)
- Add voice recordings and file attachments
- Upload images and documents to accompany the letter

### Voice Recording

- Click "Ghi Âm" (Record) to record voice messages
- Automatically saved as audio attachments
- Works in modern browsers with microphone access

### Events

- Create upcoming events (anniversaries, dates, etc.)
- View upcoming events with countdown
- Attach photos and letters to events
- See past events in a separate section

## File Storage

### Local Development

Files are stored in Vercel Blob (cloud storage). If you don't have a token, you can:
- Use image URLs instead of uploading
- Set up Vercel Blob in your Vercel project settings

### Production Deployment

1. Set up a Vercel project
2. Add `VERCEL_BLOB_TOKEN` to environment variables
3. Deploy with `vercel` command

## Database Tables

The app creates these tables:

- **users** - User accounts with passwords
- **albums** - Photo albums
- **photos** - Photos in albums
- **letters** - Love letters with scheduled unlocks
- **attachments** - Files attached to letters/events
- **events** - Upcoming events
- **event_letters** - Linking letters to events

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- 7-day session expiration
- Server-side token validation
- SQL parameterized queries

## Troubleshooting

### "Connection refused" Error

Make sure MySQL is running:
- **Windows**: Check Services or start MySQL from MySQL Workbench
- **Mac**: `brew services start mysql`
- **Linux**: `sudo systemctl start mysql`

### "Unknown database" Error

Run the initialization script again:

```bash
node scripts/init-db.js
```

### File Upload Issues

Make sure `VERCEL_BLOB_TOKEN` is set in `.env.local`. Without it, file uploads will fail.

### Login Issues

Clear cookies and try again:
- Clear browser cookies for localhost
- Try in an incognito window
- Check that MySQL is running

## Customization

### Change Colors

Edit these files to customize the rose/pink theme:
- `app/globals.css` - Global styles
- Component files use Tailwind classes (look for `rose-600`, `pink-50`, etc.)

### Change App Name

Edit `app/layout.tsx` - change "Tình Yêu Của Chúng Ta" to your preferred name

### Add More Features

The API is RESTful and can easily be extended with:
- Message/chat system
- Photo galleries with collaborative editing
- Comment/reaction system on photos
- Wishlist sharing
- Timeline view of memories

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Set Environment Variables on Vercel

1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add all variables from `.env.local`:
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `JWT_SECRET`
   - `VERCEL_BLOB_TOKEN`

### Using Remote MySQL

For production, use a managed database service:
- Supabase PostgreSQL (requires code changes)
- Amazon RDS MySQL
- DigitalOcean Managed Database
- PlanetScale MySQL
- Neon PostgreSQL (requires code changes)

## Support

For issues or questions, check:
- Console logs in browser DevTools
- Server logs in terminal
- Database connection settings in `.env.local`

Enjoy your romantic app! 💕
