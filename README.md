# 💕 Tình Yêu Của Chúng Ta

Một ứng dụng web lãng mạn dành cho các cặp đôi chia sẻ kỷ niệm, thư tay, và sự kiện.

## ✨ Tính Năng

- 👥 **Hai tài khoản sẵn** - Anh Xã & Em Xã
- 🔐 **Đăng nhập passcode** - Nhập 6 số, mỗi ô 1 số
- 📷 **Album ảnh** - Lưu trữ và chia sẻ kỷ niệm
- 💌 **Thư tay** - Viết thư có ghi âm, ảnh, và tệp đính kèm
- 📅 **Hẹn giờ mở thư** - Thư sẽ mở vào ngày giờ chỉ định
- 🎉 **Sự kiện** - Quản lý và hiển thị sự kiện sắp tới
- 🎙️ **Ghi âm giọng nói** - Ghi âm trực tiếp trong browser
- 🎨 **Giao diện cute** - Toàn bộ app với hiệu ứng animation

## 🔐 Tài Khoản Mặc Định

| Tài Khoản | Email | Mã Gán |
|-----------|-------|--------|
| 👨 Anh Xã | cuongtadonald@gmail.com | **281120** |
| 👩 Em Xã | phuongvy01st@gmail.com | **090803** |

## 🚀 Quick Start

### 1. Cài Đặt Dependencies
```bash
pnpm install
```

### 2. Cấu Hình Database
Tạo file `.env.local`:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=couple_app
JWT_SECRET=your_secret_key_here
VERCEL_BLOB_TOKEN=your_blob_token_here (optional)
```

### 3. Khởi Tạo Database
```bash
node scripts/init-db.js
```

### 4. Chạy Dev Server
```bash
pnpm dev
```

Truy cập: http://localhost:3000

## 📚 Công Nghệ Sử Dụng

- **Frontend**: React 19, Next.js 16, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Storage**: Vercel Blob (optional)
- **Auth**: JWT Tokens
- **UI Components**: shadcn/ui

## 📁 Cấu Trúc Project

```
.
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect page
│   ├── login/                  # Login page
│   ├── dashboard/              # Main dashboard
│   └── api/
│       ├── auth/               # Authentication routes
│       ├── albums/             # Album management
│       ├── letters/            # Love letters
│       ├── events/             # Events
│       └── attachments/        # File uploads
├── components/
│   ├── AlbumList.tsx
│   ├── AlbumDetail.tsx
│   ├── AlbumModal.tsx
│   ├── LetterList.tsx
│   ├── LetterDetail.tsx
│   ├── LetterModal.tsx
│   ├── EventList.tsx
│   ├── EventDetail.tsx
│   └── EventModal.tsx
├── lib/
│   ├── auth.ts                 # Auth utilities
│   ├── auth-context.tsx        # React context
│   └── db.ts                   # Database connection
├── scripts/
│   └── init-db.js              # Database initialization
└── SETUP.md                    # Detailed setup guide
```

## 🎨 Giao Diện

### Trang Đăng Nhập
- 6 ô nhập passcode (mỗi ô 1 số)
- Hiệu ứng shake khi nhập sai
- Nền gradient rose-pink-rose
- Emoji cute (💕, ✨, 💑)

### Dashboard
- Tab navigation: Ảnh 📷 | Thư 💌 | Sự Kiện 🎉
- Cards với hover effect
- Animations mượt mà

### Album
- Grid layout albums
- Xem ảnh trong album
- Upload ảnh mới

### Thư Tay
- Tạo thư với text, voice, ảnh
- Hẹn giờ mở thư
- Hiển thị trạng thái khóa/mở

### Sự Kiện
- Sự kiện sắp tới
- Sự kiện đã qua
- Chi tiết với ảnh và thư đính kèm

## 💡 Tính Năng Chi Tiết

### Thư Tay (Love Letters)
- ✍️ Viết text
- 🎙️ Ghi âm giọng nói
- 📸 Đính kèm ảnh
- 📄 Đính kèm tài liệu
- 📅 Hẹn ngày/giờ mở
- 🔒 Tự động khóa cho đến khi đến giờ

### Album
- 🖼️ Tạo nhiều album
- 📷 Upload ảnh với caption
- 🎞️ Xem ảnh dạng gallery
- 📊 Hiển thị số lượng ảnh

### Sự Kiện
- 🎉 Tạo sự kiện với ngày/giờ
- 📍 Thêm địa điểm
- 📎 Đính kèm ảnh
- 💌 Đính kèm thư tay
- 🗓️ Phân loại sự kiện sắp tới/đã qua

## 🔒 Bảo Mật

- JWT token authentication
- Password hashing với bcryptjs
- 7-day session lifetime
- Secure cookie storage

## 📝 License

Created with ❤️ for couples

---

**Made with v0 by Vercel** 💨
