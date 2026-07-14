# 🚀 Quick Start Guide - Tình Yêu Của Chúng Ta

## ⚡ 5 Phút Setup

### 1️⃣ Cài Dependencies (2 phút)
```bash
cd my-project
pnpm install
```

### 2️⃣ Cấu Hình Database (1 phút)
Tạo `.env.local` file:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=couple_app
JWT_SECRET=change_me_to_something_secret_key_12345
```

### 3️⃣ Khởi Tạo Database (1 phút)
```bash
node scripts/init-db.js
```

### 4️⃣ Chạy Dev Server (1 phút)
```bash
pnpm dev
```

## 🎮 Sử Dụng

Truy cập: **http://localhost:3000**

### 🔐 Login
- **Anh Xã**: Nhập `2 8 1 1 2 0`
- **Em Xã**: Nhập `0 9 0 8 0 3`

### 📸 Tạo Album
1. Vào tab "📷 Ảnh Kỷ Niệm"
2. Nhấn "Tạo Album Mới"
3. Nhập tên & mô tả
4. Xem ảnh trong album

### 💌 Viết Thư Tay
1. Vào tab "💌 Thư Tay"
2. Nhấn "Viết Thư Mới"
3. Chọn:
   - ✍️ Viết text
   - 🎙️ Ghi âm (click để bắt đầu/dừng)
   - 📎 Thêm ảnh/tài liệu
   - 📅 Hẹn ngày/giờ mở
4. Lưu thư

### 🎉 Tạo Sự Kiện
1. Vào tab "🎉 Sự Kiện"
2. Nhấn "Tạo Sự Kiện"
3. Nhập:
   - 🎪 Tên sự kiện
   - 📝 Mô tả
   - 📅 Ngày & giờ
   - 📍 Địa điểm
4. Tạo xong!

## 📱 Thiết Bị Hỗ Trợ

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ✅ Mobile (iPhone, Android)

## 🎨 Tính Năng
- 💕 Giao diện lãng mạn
- ✨ Hiệu ứng animation mượt
- 🔒 Thư khóa với hẹn giờ
- 🎙️ Ghi âm giọng nói
- 📎 Đính kèm tệp
- 🗓️ Quản lý sự kiện

## 🆘 Gặp Lỗi?

### Database Connection Error
```
❌ Error: connect ECONNREFUSED 127.0.0.1:3306
```
→ Kiểm tra MySQL đang chạy: `mysql --version`

### "Cannot find module" Error
```
❌ Error: Cannot find module 'mysql2'
```
→ Cài lại: `pnpm install`

### Port 3000 đang dùng
```bash
# Dùng port khác
PORT=3001 pnpm dev
```

## 📚 Tài Liệu

- 📖 Xem `README.md` để tìm hiểu thêm
- 📋 Xem `SETUP.md` để setup chi tiết
- ✅ Xem `COMPLETION.md` để xem gì đã được làm

## 🎬 Demo Features

**Thư Tay Hẹn Giờ:**
1. Viết thư
2. Chọn ngày mai làm ngày mở
3. Thư sẽ hiển thị "🔒 Khóa"
4. Vào lúc ngày giờ chỉ định, thư tự động "✓ Mở"

**Album Ảnh:**
1. Tạo "Kỷ Niệm Hè 2024"
2. Thêm ảnh từ đường dẫn URL
3. Viết caption cho mỗi ảnh
4. Xem gallery theo grid

**Sự Kiện:**
1. Tạo "Kỉ Niệm 2 Năm Bên Nhau"
2. Chọn ngày trong tương lai
3. Tệp sẽ ở "Sự Kiện Sắp Tới"
4. Khi qua ngày, tự động chuyển "Sự Kiện Đã Qua"

---

**✨ Bắt đầu tạo kỷ niệm yêu thương nôi!** 💕
