# 🏗️ Kiến Trúc Công Nghệ - Tình Yêu Của Chúng Ta

## 📊 Tech Stack (Công Nghệ Sử Dụng)

### Frontend
```
React 19.2.0
  ↓
Next.js 16 (App Router)
  ↓
TypeScript 5.7.3
  ↓
Tailwind CSS 4.2.0
  ↓
shadcn/ui Components
```

### Backend
```
Next.js 16 API Routes (Node.js)
  ↓
JWT Authentication
  ↓
Bcryptjs (Password Hashing)
```

### Database
```
MySQL 8.0
  ↓
mysql2 Driver
```

### Storage (File Upload)
```
Vercel Blob Storage (Optional)
  ↓
@vercel/blob Library
```

### Utilities
```
- js-cookie: Cookie management
- jsonwebtoken: JWT tokens
- bcryptjs: Password encryption
- lucide-react: Icons
- dotenv: Environment variables
- clsx & tailwind-merge: Class merging
```

---

## 📁 Cấu Trúc Thư Mục Chi Tiết

```
Tình-Yêu-Của-Chúng-Ta/
│
├── 📄 DOCUMENTATION FILES
│   ├── README.md                  # Project overview
│   ├── SETUP.md                   # Setup guide chi tiết
│   ├── QUICK_START.md             # 5-minute quickstart
│   ├── COMPLETION.md              # Những gì đã hoàn thành
│   ├── ARCHITECTURE.md            # File này - Kiến trúc
│   └── NGON_NGU_VIET_NAM.txt      # Hướng dẫn Tiếng Việt
│
├── 📦 app/ (Next.js App Directory)
│   │
│   ├── 📄 layout.tsx
│   │   └── Root layout với AuthProvider
│   │       (CSS global, font, metadata)
│   │
│   ├── 📄 page.tsx
│   │   └── Home page - Redirect logic
│   │       (Nếu login → /dashboard, không → /login)
│   │
│   ├── 📄 globals.css
│   │   ├── Tailwind directives
│   │   ├── Custom animations
│   │   │   └── @keyframes: float, glow, heartbeat
│   │   └── Theme variables
│   │
│   ├── 🔐 login/
│   │   └── page.tsx
│   │       ├── Passcode input (6 ô)
│   │       ├── Validation logic
│   │       ├── Animation effects
│   │       └── Error handling
│   │
│   ├── 📊 dashboard/
│   │   └── page.tsx
│   │       ├── Tab navigation (Albums | Letters | Events)
│   │       ├── User greeting
│   │       ├── Logout button
│   │       └── Main content area
│   │
│   └── 🔌 api/ (Backend Routes)
│       │
│       ├── 🔐 auth/
│       │   ├── login/
│       │   │   └── route.ts
│       │   │       ├── POST /api/auth/login
│       │   │       ├── Check passcode against DB
│       │   │       ├── Generate JWT token
│       │   │       └── Return user data
│       │   │
│       │   └── logout/ (Optional - client-side)
│       │
│       ├── 📷 albums/
│       │   ├── route.ts
│       │   │   ├── GET: List all albums
│       │   │   └── POST: Create new album
│       │   │
│       │   └── [albumId]/
│       │       └── photos/
│       │           └── route.ts
│       │               ├── GET: List photos in album
│       │               ├── POST: Add photo to album
│       │               └── DELETE: Remove photo
│       │
│       ├── 💌 letters/
│       │   └── route.ts
│       │       ├── GET: List letters
│       │       ├── POST: Create letter
│       │       ├── PATCH: Update letter
│       │       └── DELETE: Remove letter
│       │
│       ├── 🎉 events/
│       │   └── route.ts
│       │       ├── GET: List events
│       │       ├── POST: Create event
│       │       ├── PATCH: Update event
│       │       └── DELETE: Remove event
│       │
│       └── 📎 attachments/
│           └── route.ts
│               ├── POST: Upload file
│               │   (Ghi âm, ảnh, tài liệu)
│               ├── Vercel Blob integration
│               └── Return file URL
│
├── 🧩 components/ (React Components)
│   │
│   ├── 📷 ALBUM COMPONENTS
│   │   ├── AlbumList.tsx
│   │   │   └── Grid view của tất cả albums
│   │   │       ├── Fetch albums from API
│   │   │       ├── Cards với click handlers
│   │   │       ├── Loading state
│   │   │       └── Empty state
│   │   │
│   │   ├── AlbumModal.tsx
│   │   │   └── Modal form tạo album mới
│   │   │       ├── Text input (title, description)
│   │   │       ├── Submit handler
│   │   │       └── Error handling
│   │   │
│   │   └── AlbumDetail.tsx
│   │       └── Gallery view của album
│   │           ├── Display all photos
│   │           ├── Upload new photos
│   │           └── Photo grid
│   │
│   ├── 💌 LETTER COMPONENTS
│   │   ├── LetterList.tsx
│   │   │   └── Danh sách thư tay
│   │   │       ├── Fetch letters from API
│   │   │       ├── Show lock status (🔒 / ✓)
│   │   │       ├── Handle scheduled unlock
│   │   │       └── Cards with preview text
│   │   │
│   │   ├── LetterModal.tsx
│   │   │   └── Modal form viết thư tay
│   │   │       ├── Text editor
│   │   │       ├── Voice recorder (🎙️)
│   │   │       ├── File uploader
│   │   │       ├── Date/time picker
│   │   │       └── Submit handler
│   │   │
│   │   └── LetterDetail.tsx
│   │       └── Hiển thị chi tiết thư
│   │           ├── Text content
│   │           ├── Audio player (voice)
│   │           ├── Image gallery
│   │           ├── File downloads
│   │           ├── Scheduled unlock logic
│   │           └── Mark as read
│   │
│   ├── 🎉 EVENT COMPONENTS
│   │   ├── EventList.tsx
│   │   │   └── Danh sách sự kiện
│   │   │       ├── Upcoming events (sắp tới)
│   │   │       ├── Past events (đã qua)
│   │   │       ├── Cards with date/time
│   │   │       └── Location badge
│   │   │
│   │   ├── EventModal.tsx
│   │   │   └── Modal tạo sự kiện mới
│   │   │       ├── Title, description
│   │   │       ├── Date/time picker
│   │   │       ├── Location input
│   │   │       ├── Attach files/photos
│   │   │       └── Submit handler
│   │   │
│   │   └── EventDetail.tsx
│   │       └── Hiển thị chi tiết sự kiện
│   │           ├── Event info
│   │           ├── Attached photos
│   │           ├── Attached letters
│   │           └── RSVP/notes
│   │
│   └── 🎨 ui/
│       └── button.tsx
│           └── shadcn Button component
│
├── 📚 lib/ (Utilities & Logic)
│   │
│   ├── auth-context.tsx
│   │   ├── React Context API
│   │   ├── AuthContext provider
│   │   ├── User state management
│   │   ├── Token management
│   │   ├── loginWithPasscode() function
│   │   └── logout() function
│   │
│   ├── auth.ts
│   │   ├── comparePassword() - Verify passcode
│   │   ├── generateToken() - Create JWT
│   │   └── verifyToken() - Validate JWT
│   │
│   ├── db.ts
│   │   ├── MySQL connection pool
│   │   └── getConnection() - Get DB connection
│   │
│   └── utils.ts
│       └── cn() - Class merge utility
│
├── 🗄️ DATABASE (MySQL)
│   │
│   ├── users (Tài khoản)
│   │   ├── id (PK)
│   │   ├── email
│   │   ├── password (hashed)
│   │   ├── full_name (anh xãa / em xãa)
│   │   ├── role (anh / em)
│   │   ├── profile_image_url
│   │   └── created_at
│   │
│   ├── albums (Album ảnh)
│   │   ├── id (PK)
│   │   ├── user_id (FK)
│   │   ├── title
│   │   ├── description
│   │   ├── photo_count
│   │   └── created_at
│   │
│   ├── photos (Ảnh)
│   │   ├── id (PK)
│   │   ├── album_id (FK)
│   │   ├── url
│   │   ├── caption
│   │   ├── created_at
│   │
│   ├── letters (Thư tay)
│   │   ├── id (PK)
│   │   ├── from_user_id (FK)
│   │   ├── to_user_id (FK)
│   │   ├── title
│   │   ├── text_content
│   │   ├── scheduled_unlock_date
│   │   ├── is_opened
│   │   └── created_at
│   │
│   ├── attachments (Tệp đính kèm)
│   │   ├── id (PK)
│   │   ├── letter_id (FK, nullable)
│   │   ├── event_id (FK, nullable)
│   │   ├── type (image/audio/document)
│   │   ├── url
│   │   ├── file_name
│   │   └── created_at
│   │
│   ├── events (Sự kiện)
│   │   ├── id (PK)
│   │   ├── user_id (FK)
│   │   ├── title
│   │   ├── description
│   │   ├── event_date
│   │   ├── location
│   │   └── created_at
│   │
│   └── event_letters (Thư gắn với sự kiện)
│       ├── id (PK)
│       ├── event_id (FK)
│       ├── letter_id (FK)
│       └── created_at
│
├── 🔧 scripts/
│   └── init-db.js
│       ├── Create MySQL database
│       ├── Create all tables
│       ├── Insert 2 pre-made accounts
│       │   ├── Anh Xãa (281120)
│       │   └── Em Xãa (090803)
│       └── Verify connection
│
└── ⚙️ CONFIG FILES
    ├── package.json
    │   ├── Dependencies
    │   ├── DevDependencies
    │   └── Scripts (dev, build, start, lint)
    │
    ├── next.config.mjs
    │   ├── TypeScript config
    │   └── Image optimization
    │
    ├── tsconfig.json
    │   └── TypeScript configuration
    │
    ├── tailwind.config.ts
    │   ├── Color theme
    │   ├── Custom animations
    │   └── Spacing scale
    │
    ├── postcss.config.mjs
    │   └── Tailwind processing
    │
    ├── components.json
    │   └── shadcn/ui config
    │
    └── .env.local (Not in repo)
        ├── MYSQL_HOST
        ├── MYSQL_USER
        ├── MYSQL_PASSWORD
        ├── MYSQL_DATABASE
        ├── JWT_SECRET
        └── VERCEL_BLOB_TOKEN (optional)
```

---

## 🔄 Flow Kiến Trúc (Architecture Flow)

### 1. AUTHENTICATION FLOW (Quy Trình Đăng Nhập)
```
User (Browser)
    ↓
page.tsx (Login)
    ↓ [Nhập 6 số]
Input Handler
    ↓
POST /api/auth/login
    ↓
DB Query (users table)
    ↓
bcryptjs.compare(passcode, hashed_password)
    ↓
jwt.sign() → Generate token
    ↓
Response: { user, token }
    ↓
AuthContext.loginWithPasscode()
    ↓
Cookies.set('authToken')
    ↓
Router.push('/dashboard')
```

### 2. ALBUM MANAGEMENT FLOW
```
Dashboard → AlbumList Component
    ↓
GET /api/albums (Fetch albums)
    ↓
Display in Grid Cards
    ↓
Click card → AlbumDetail
    ↓
Display Photos in Gallery
    ↓
Click "Add" → File Upload
    ↓
POST /api/albums/[id]/photos
    ↓
Vercel Blob Upload
    ↓
Save URL to DB
    ↓
Refresh gallery
```

### 3. LETTER MANAGEMENT FLOW
```
Dashboard → LetterList Component
    ↓
GET /api/letters (Fetch letters)
    ↓
Check scheduled_unlock_date
    ↓
If date passed → Show "✓ Mở"
   Else → Show "🔒 Khóa"
    ↓
Click card → LetterDetail
    ↓
Display: Text + Audio + Images + Files
    ↓
Click "Play Audio" → MediaPlayer
```

### 4. LETTER CREATION FLOW
```
Click "Viết Thư Mới"
    ↓
LetterModal Opens
    ↓
User fills:
  - Title
  - Text content
  - Press "🎙️" to record audio
    └── MediaRecorder API (Browser)
  - Upload images
  - Pick date/time (scheduled_unlock_date)
    ↓
POST /api/letters (Create)
    ↓
POST /api/attachments (Upload files)
    ↓
Vercel Blob stores files
    ↓
DB stores references
    ↓
LetterList refreshes
```

### 5. EVENT MANAGEMENT FLOW
```
Dashboard → EventList Component
    ↓
GET /api/events
    ↓
Filter by date:
  - Future → "Sự Kiện Sắp Tới"
  - Past → "Sự Kiện Đã Qua"
    ↓
Display in respective sections
    ↓
Click card → EventDetail
    ↓
Show: Event info + Attached photos + Attached letters
```

---

## 🔐 SECURITY IMPLEMENTATION

### 1. Password Security
```
Raw Passcode: "281120"
    ↓
bcryptjs.hash(passcode, 10)
    ↓
Hashed: $2a$10$... (stored in DB)
    ↓
On Login: bcryptjs.compare(input, hashed)
    ↓
Boolean: true/false
```

### 2. JWT Authentication
```
On Login:
  jwt.sign({
    userId: user.id,
    email: user.email,
    role: user.role
  }, JWT_SECRET, { expiresIn: '7d' })
    ↓
Token stored in: HttpOnly Cookie
    ↓
Sent with every request
    ↓
Verified on middleware/API routes
    ↓
7-day expiration
```

### 3. Data Privacy
```
- User can only see their own albums
- Letters between 2 accounts
- Events per user
- No cross-user data access
```

---

## 🎨 STYLING & DESIGN SYSTEM

### Colors (Tailwind Theme)
```
Primary: rose-500 to pink-500
Secondary: gray-600
Background: bg-rose-50 to pink-50
Accent: rose-200, pink-200, red-100
```

### Animations (CSS @keyframes)
```
1. float - Floating motion (cards)
2. glow - Glowing border effect
3. heartbeat - Pulse animation (💕)
4. fade-in - Smooth page transition
```

### Components
```
Buttons:
  - gradient bg (rose → pink)
  - hover: scale(1.05)
  - shadow effects

Cards:
  - backdrop blur
  - rounded-2xl corners
  - hover: scale(1.05) + shadow
  - border: rose-100

Forms:
  - Passcode inputs (6 separate fields)
  - Text areas
  - Date/time pickers
  - File uploaders
```

---

## 📊 DATA RELATIONSHIPS (ER Diagram)

```
users (1) ──→ (M) albums
  │
  ├──→ (M) letters (from_user_id & to_user_id)
  │     │
  │     └──→ (M) attachments
  │
  └──→ (M) events
        │
        └──→ (M) attachments
              └──→ (M) event_letters → (M) letters

users: 2 accounts (Anh Xãa, Em Xãa)
albums: Multiple per user
letters: Between 2 users
events: Created by 1 user
attachments: Can belong to letters or events
```

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Local Development
```
pnpm dev
  ↓
http://localhost:3000
  ├── React Dev Server (Hot reload)
  ├── Next.js API Routes
  └── MySQL Connection (local)
```

### Production (Vercel)
```
vercel deploy
  ↓
Next.js on Vercel Edge Network
  ├── Frontend (React SSR)
  ├── API Routes (Serverless Functions)
  └── Database (External MySQL/AWS RDS)
  ├── Storage (Vercel Blob)
  └── Domains & SSL
```

---

## 📈 PERFORMANCE CONSIDERATIONS

1. **Image Optimization**
   - Vercel Blob for file storage
   - Lazy loading for photos

2. **Database**
   - Connection pooling (10 connections)
   - Indexed primary keys
   - Foreign key relationships

3. **Frontend**
   - React 19 + Concurrent features
   - Code splitting (Next.js automatic)
   - CSS-in-JS (Tailwind)

4. **Caching**
   - JWT tokens (7 days)
   - Browser cache (static assets)

---

## 🛠️ DEVELOPMENT WORKFLOW

```
1. Edit components in /components
2. Update API routes in /app/api
3. Add database migrations to init-db.js
4. pnpm dev → Test at localhost:3000
5. pnpm build → Check for errors
6. pnpm lint → Check code quality
7. Deploy to Vercel
```

---

## 📝 KEY FILES RELATIONSHIPS

```
page.tsx (home)
  ↓ imports
  auth-context.tsx → Checks auth
  ↓
  /login/page.tsx OR /dashboard/page.tsx
    ↓ imports
    LetterList.tsx, AlbumList.tsx, EventList.tsx
    ↓ make API calls to
    /api/auth/login
    /api/albums
    /api/letters
    /api/events
    ↓ save to
    MySQL Database
    ↓ upload files to
    Vercel Blob
```

Hy vọng bạn hiểu rõ hơn về kiến trúc và cấu trúc của dự án! Nếu cần chi tiết thêm, xin vui lòng hỏi. 💕
