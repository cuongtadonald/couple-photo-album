# 🏗️ Tech Stack - Sơ Đồ Kiến Trúc Visual

## 📊 Layer Architecture (Kiến Trúc Phân Tầng)

```
┌─────────────────────────────────────────────────────────────┐
│                   🌐 BROWSER (Client)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          React 19 + Next.js 16 (App Router)        │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Pages:                                      │   │   │
│  │  │  • /login - Passcode Input (6 ô)            │   │   │
│  │  │  • /dashboard - Main UI                      │   │   │
│  │  │    ├── 📷 Albums Tab                         │   │   │
│  │  │    ├── 💌 Letters Tab                        │   │   │
│  │  │    └── 🎉 Events Tab                         │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Components (React):                         │   │   │
│  │  │  • AlbumList, AlbumDetail, AlbumModal       │   │   │
│  │  │  • LetterList, LetterDetail, LetterModal    │   │   │
│  │  │  • EventList, EventDetail, EventModal       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Styling:                                    │   │   │
│  │  │  • Tailwind CSS 4.2                         │   │   │
│  │  │  • Custom Animations (@keyframes)           │   │   │
│  │  │  • shadcn/ui Components                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  State Management:                           │   │   │
│  │  │  • React Context (AuthContext)               │   │   │
│  │  │  • useState hooks                            │   │   │
│  │  │  • JWT tokens (js-cookie)                    │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Browser APIs:                               │   │   │
│  │  │  • MediaRecorder (Voice Recording)           │   │   │
│  │  │  • File Upload API                           │   │   │
│  │  │  • localStorage (Tokens)                     │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕️
                  (HTTP/HTTPS Requests)
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│              🔧 APPLICATION SERVER (Backend)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Next.js 16 - API Routes (Serverless)         │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Authentication:                             │   │   │
│  │  │  POST /api/auth/login                        │   │   │
│  │  │    └─→ Verify passcode                       │   │   │
│  │  │    └─→ Generate JWT token                    │   │   │
│  │  │    └─→ Return user data                      │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Album Management:                           │   │   │
│  │  │  GET  /api/albums                            │   │   │
│  │  │  POST /api/albums (create)                   │   │   │
│  │  │  GET  /api/albums/[id]/photos                │   │   │
│  │  │  POST /api/albums/[id]/photos (upload)       │   │   │
│  │  │  DELETE /api/albums/[id]/photos/[pid]        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Letter Management:                          │   │   │
│  │  │  GET   /api/letters                          │   │   │
│  │  │  POST  /api/letters (create)                 │   │   │
│  │  │  PATCH /api/letters/[id] (update)            │   │   │
│  │  │  DELETE /api/letters/[id]                    │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Event Management:                           │   │   │
│  │  │  GET   /api/events                           │   │   │
│  │  │  POST  /api/events (create)                  │   │   │
│  │  │  PATCH /api/events/[id] (update)             │   │   │
│  │  │  DELETE /api/events/[id]                     │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  File Upload:                                │   │   │
│  │  │  POST /api/attachments                       │   │   │
│  │  │    └─→ Verify file type                      │   │   │
│  │  │    └─→ Upload to Vercel Blob                 │   │   │
│  │  │    └─→ Save URL to database                  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Middleware/Utilities:                       │   │   │
│  │  │  • JWT verification                          │   │   │
│  │  │  • bcryptjs password hashing                 │   │   │
│  │  │  • Error handling                            │   │   │
│  │  │  • CORS headers                              │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕️
                  (SQL Queries + REST)
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│               💾 DATA LAYER (Persistence)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MySQL 8.0 Database                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Connection Pool (10 connections):           │   │   │
│  │  │  mysql2 Driver                               │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Tables:                                     │   │   │
│  │  │  1. users (2 accounts pre-created)          │   │   │
│  │  │  2. albums (Photo albums)                    │   │   │
│  │  │  3. photos (Individual photos)               │   │   │
│  │  │  4. letters (Love letters)                   │   │   │
│  │  │  5. attachments (Files - images, audio)      │   │   │
│  │  │  6. events (Events)                          │   │   │
│  │  │  7. event_letters (M2M: events ↔ letters)   │   │   │
│  │  │  8. sessions (Optional for tokens)           │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Relationships:                              │   │   │
│  │  │  users (1) ──→ (M) albums                    │   │   │
│  │  │  albums (1) ──→ (M) photos                   │   │   │
│  │  │  users (1) ──→ (M) letters                   │   │   │
│  │  │  letters (1) ──→ (M) attachments             │   │   │
│  │  │  users (1) ──→ (M) events                    │   │   │
│  │  │  events (1) ──→ (M) attachments              │   │   │
│  │  │  events (M) ──→ (M) letters                  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕️
                      (File Upload)
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│             📁 STORAGE LAYER (File Management)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        Vercel Blob Storage (Optional)              │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  File Types Supported:                       │   │   │
│  │  │  • Images (album photos): .jpg, .png, .gif   │   │   │
│  │  │  • Audio (voice recordings): .webm, .mp3     │   │   │
│  │  │  • Documents: .pdf, .txt, .doc               │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  Blob Operations:                            │   │   │
│  │  │  • PUT: Upload file                          │   │   │
│  │  │  • GET: Download file                        │   │   │
│  │  │  • DELETE: Remove file                       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request/Response Flow

### 📝 Ví Dụ: Đăng Nhập

```
User Browser:
┌────────────────────────────────────────┐
│ Input: 2-8-1-1-2-0 (Passcode)         │
│ Click: 💗 Vào Button                  │
└────────────────────────────────────────┘
              ↓
         Submit Form
              ↓
     POST /api/auth/login
     Body: { passcode: "281120" }
              ↓
    ┌─────────────────────────────┐
    │  Next.js API Route Handler  │
    │  ├─ Get passcode            │
    │  ├─ Query DB users table    │
    │  ├─ Loop through users      │
    │  ├─ bcryptjs.compare()      │
    │  │  Compare with all hashes │
    │  ├─ Find match (Anh Xãa)    │
    │  ├─ jwt.sign() → Create JWT │
    │  └─ Return response         │
    └─────────────────────────────┘
              ↓
     Response: 200 OK
     {
       user: {
         id: 1,
         email: "cuongtadonald@gmail.com",
         fullName: "anh xãa",
         role: "anh"
       },
       token: "eyJhbGc..."
     }
              ↓
    AuthContext.loginWithPasscode()
              ↓
    Cookies.set('authToken', token)
              ↓
    Router.push('/dashboard')
              ↓
┌────────────────────────────────────────┐
│  Dashboard Loaded                       │
│  "Xin chào, anh xãa"                   │
│  ├─ 📷 Albums Tab                      │
│  ├─ 💌 Letters Tab                     │
│  └─ 🎉 Events Tab                      │
└────────────────────────────────────────┘
```

### 💌 Ví Dụ: Viết Thư Tay Hẹn Giờ

```
User Action:
┌────────────────────────────────────────┐
│ Click: "Viết Thư Mới"                  │
│ ↓ LetterModal Opens                    │
│ ├─ Input Title: "Thư tình yêu"        │
│ ├─ Input Text: "Anh yêu em..."         │
│ ├─ Click 🎙️: Record voice             │
│ │  └─ MediaRecorder API                │
│ │  └─ Save as .webm                    │
│ ├─ Upload Image 📷                     │
│ ├─ Select Date: "28/11/2025 20:00"     │
│ └─ Click "Lưu"                         │
└────────────────────────────────────────┘
              ↓
    POST /api/letters
    Body: {
      title: "Thư tình yêu",
      text_content: "Anh yêu em...",
      scheduled_unlock_date: "2025-11-28T20:00:00",
      to_user_id: 2
    }
              ↓
    ┌─────────────────────────────┐
    │  Next.js API Handler        │
    │  ├─ Verify JWT token        │
    │  ├─ Validate data           │
    │  ├─ INSERT into letters DB  │
    │  └─ Get letter_id           │
    └─────────────────────────────┘
              ↓
    Response: {
      id: 42,
      title: "Thư tình yêu",
      created_at: "2025-11-27"
    }
              ↓
    Upload Voice File:
    POST /api/attachments
    Form Data: { audio_file, letter_id: 42 }
              ↓
    ┌─────────────────────────────┐
    │  Vercel Blob Upload         │
    │  └─ Return URL              │
    └─────────────────────────────┘
              ↓
    INSERT into attachments:
    {
      letter_id: 42,
      type: "audio",
      url: "blob_url_here",
      file_name: "voice.webm"
    }
              ↓
    LetterList Refreshes
              ↓
┌────────────────────────────────────────┐
│ New Letter Appears:                     │
│ 📮 "Thư tình yêu"                      │
│ 🔒 Khóa (scheduled unlock)              │
│ 📅 28/11/2025 20:00                     │
│ Preview: "Anh yêu em..."                │
└────────────────────────────────────────┘
              ↓
    [Next day at 20:00]
    User opens app
    LetterList checks:
    if (now >= scheduled_unlock_date)
    ↓
    🔒 changes to ✓ Mở
```

---

## 📦 Dependencies Breakdown

### Production Dependencies

```
Frontend Libraries:
├─ react@19
│  └─ Latest React with concurrent features
├─ react-dom@19
│  └─ React DOM rendering
├─ next@16.2.6
│  └─ Next.js App Router + API routes
└─ typescript@5.7.3
   └─ Type safety

Styling:
├─ tailwindcss@4.2.0
│  └─ Utility-first CSS framework
├─ @tailwindcss/postcss@4.2.0
│  └─ Tailwind CSS processing
├─ class-variance-authority@0.7.1
│  └─ Component variant management
├─ clsx@2.1.1
│  └─ Conditional class names
├─ tailwind-merge@3.3.1
│  └─ Merge Tailwind classes
└─ tw-animate-css@1.4.0
   └─ Additional animations

UI Components:
├─ shadcn@4.8.0
│  └─ shadcn/ui component library
├─ lucide-react@1.16.0
│  └─ Icon components
└─ @base-ui/react@1.5.0
   └─ Headless components

Backend/Security:
├─ jsonwebtoken@9.0.3
│  └─ JWT token generation/verification
├─ bcryptjs@3.0.3
│  └─ Password hashing
└─ mysql2@3.22.6
   └─ MySQL database driver

Utilities:
├─ js-cookie@3.0.8
│  └─ Cookie management
├─ dotenv@17.4.2
│  └─ Environment variables
└─ @vercel/blob@2.6.1
   └─ File storage (optional)

Analytics:
└─ @vercel/analytics@1.6.1
   └─ Performance monitoring
```

### Dev Dependencies

```
├─ @types/node@24
│  └─ Node.js type definitions
├─ @types/react@19
│  └─ React type definitions
├─ @types/react-dom@19
│  └─ React DOM type definitions
└─ postcss@8.5
   └─ CSS processing
```

---

## 🎯 Technology Decision Matrix

| Requirement | Technology | Why? |
|------------|-----------|------|
| Frontend Framework | React 19 + Next.js 16 | Server/Client components, built-in API routes |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS 4 | Utility-first, rapid development, customizable |
| UI Components | shadcn/ui | Pre-built, accessible components |
| Database | MySQL | Relational, structured data, reliable |
| Database Driver | mysql2 | Fast, supports connection pooling |
| Authentication | JWT | Stateless, scalable, secure |
| Password Hashing | bcryptjs | Industry standard, secure |
| File Storage | Vercel Blob | Integrated with Vercel, simple API |
| Icons | lucide-react | Beautiful, consistent SVG icons |
| State Management | React Context | No extra library needed, built-in |
| Audio Recording | Web Audio API | Browser native, no dependencies |
| Environment Config | dotenv | Standard, simple |

---

## 🚀 Why This Stack?

✅ **Fast Development**: Next.js, React, Tailwind → Rapid prototyping
✅ **Scalable**: Can deploy to Vercel serverless, MySQL databases
✅ **Type-Safe**: Full TypeScript support
✅ **Secure**: JWT, bcryptjs, HTTPS ready
✅ **Beautiful**: Tailwind CSS + shadcn/ui → Gorgeous UI
✅ **Reliable**: Production-ready libraries
✅ **Easy to Maintain**: Clear separation of concerns
✅ **Great DX**: Hot reload, TypeScript, easy debugging

---

## 📊 Comparison: Monolithic vs Microservices

### Current Architecture: Monolithic (Recommended)

```
┌─────────────────────────────┐
│   Single Next.js Server     │
├─────────────────────────────┤
│ Frontend (React)            │
│ Backend (API Routes)        │
│ Database Logic              │
│ File Upload Logic           │
└─────────────────────────────┘
         ↓
    Simple to deploy
    Easy to develop
    Perfect for couples app
```

### If Scaled: Microservices

```
┌──────────────────────┐   ┌──────────────────┐
│  Frontend (Vercel)   │   │  Auth Service    │
└──────────────────────┘   └──────────────────┘
         ↓                          ↓
┌──────────────────────────────────────────┐
│        API Gateway / Load Balancer       │
└──────────────────────────────────────────┘
    ↓        ↓         ↓        ↓
┌────────┐ ┌─────┐ ┌─────┐ ┌─────────┐
│ Album  │ │Letter│ │Event│ │Attachment│
│Service │ │Svc  │ │Svc  │ │Service  │
└────────┘ └─────┘ └─────┘ └─────────┘
    ↓        ↓         ↓        ↓
┌───────────────────────────────────────┐
│          Distributed Database         │
└───────────────────────────────────────┘
```

Hiện tại project dùng **Monolithic** (phù hợp cho couples app nhỏ).

Hy vọng bạn hiểu rõ hơn về toàn bộ kiến trúc công nghệ! 💕
