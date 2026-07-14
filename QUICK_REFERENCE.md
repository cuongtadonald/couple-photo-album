# 📚 Quick Reference - Tra Cứu Nhanh

## 🗂️ File Structure Quick Map

```
📁 Project Root
 ├── 📁 app/
 │   ├── page.tsx                    # Home (redirect)
 │   ├── layout.tsx                  # Root layout + AuthProvider
 │   ├── globals.css                 # Global styles + animations
 │   ├── 📁 login/
 │   │   └── page.tsx                # Login with passcode
 │   ├── 📁 dashboard/
 │   │   └── page.tsx                # Main dashboard
 │   └── 📁 api/
 │       ├── 📁 auth/
 │       │   └── 📁 login/
 │       │       └── route.ts        # POST: Login logic
 │       ├── 📁 albums/
 │       │   ├── route.ts            # GET/POST albums
 │       │   └── 📁 [albumId]/
 │       │       └── 📁 photos/
 │       │           └── route.ts    # GET/POST/DELETE photos
 │       ├── 📁 letters/
 │       │   └── route.ts            # GET/POST/PATCH/DELETE letters
 │       ├── 📁 events/
 │       │   └── route.ts            # GET/POST/PATCH/DELETE events
 │       └── 📁 attachments/
 │           └── route.ts            # POST: Upload files
 ├── 📁 components/
 │   ├── AlbumList.tsx               # Grid of albums
 │   ├── AlbumModal.tsx              # Create album form
 │   ├── AlbumDetail.tsx             # Album gallery
 │   ├── LetterList.tsx              # List of letters
 │   ├── LetterModal.tsx             # Create letter form
 │   ├── LetterDetail.tsx            # Letter viewer
 │   ├── EventList.tsx               # Events list (grouped)
 │   ├── EventModal.tsx              # Create event form
 │   ├── EventDetail.tsx             # Event viewer
 │   └── 📁 ui/
 │       └── button.tsx              # shadcn button
 ├── 📁 lib/
 │   ├── auth-context.tsx            # React Context for auth
 │   ├── auth.ts                     # Auth utilities
 │   ├── db.ts                       # MySQL connection
 │   └── utils.ts                    # Helper functions
 ├── 📁 scripts/
 │   └── init-db.js                  # DB initialization
 └── 📁 public/
     └── (Images & icons)
```

---

## 🔐 Passcode Reference

| User | Passcode | Email |
|------|----------|-------|
| 👨 Anh Xãa | **281120** | cuongtadonald@gmail.com |
| 👩 Em Xãa | **090803** | phuongvy01st@gmail.com |

---

## 🛣️ Routes (Pages & APIs)

### Pages
```
GET  /                     → Redirect to /login or /dashboard
GET  /login                → Login page with passcode
GET  /dashboard            → Main app dashboard
```

### API Routes (Authenticated)
```
POST   /api/auth/login                    → Login
GET    /api/albums                         → Fetch albums
POST   /api/albums                         → Create album
GET    /api/albums/[id]/photos             → Fetch photos
POST   /api/albums/[id]/photos             → Add photo
DELETE /api/albums/[id]/photos/[photoId]   → Delete photo
GET    /api/letters                        → Fetch letters
POST   /api/letters                        → Create letter
PATCH  /api/letters/[id]                   → Update letter
DELETE /api/letters/[id]                   → Delete letter
GET    /api/events                         → Fetch events
POST   /api/events                         → Create event
PATCH  /api/events/[id]                    → Update event
DELETE /api/events/[id]                    → Delete event
POST   /api/attachments                    → Upload file
```

---

## 💾 Database Tables

### users
```
id (PK)          | INT
email            | VARCHAR(255)
password         | VARCHAR(255) [HASHED]
full_name        | VARCHAR(255)
role             | ENUM('anh', 'em')
profile_image_url| VARCHAR(500)
created_at       | TIMESTAMP
```

### albums
```
id (PK)       | INT
user_id (FK)  | INT → users(id)
title         | VARCHAR(255)
description   | TEXT
photo_count   | INT
created_at    | TIMESTAMP
```

### photos
```
id (PK)       | INT
album_id (FK) | INT → albums(id)
url           | VARCHAR(500)
caption       | TEXT
created_at    | TIMESTAMP
```

### letters
```
id (PK)                      | INT
from_user_id (FK)            | INT → users(id)
to_user_id (FK)              | INT → users(id)
title                        | VARCHAR(255)
text_content                 | LONGTEXT
scheduled_unlock_date        | DATETIME
is_opened                    | BOOLEAN
created_at                   | TIMESTAMP
```

### attachments
```
id (PK)       | INT
letter_id (FK)| INT → letters(id) [NULLABLE]
event_id (FK) | INT → events(id) [NULLABLE]
type          | ENUM('image', 'audio', 'document')
url           | VARCHAR(500)
file_name     | VARCHAR(255)
created_at    | TIMESTAMP
```

### events
```
id (PK)       | INT
user_id (FK)  | INT → users(id)
title         | VARCHAR(255)
description   | TEXT
event_date    | DATETIME
location      | VARCHAR(255)
created_at    | TIMESTAMP
```

### event_letters
```
id (PK)       | INT
event_id (FK) | INT → events(id)
letter_id (FK)| INT → letters(id)
created_at    | TIMESTAMP
```

---

## 🎨 Color Palette

```css
Primary: rgb(244, 63, 94)     /* rose-500 */
Secondary: rgb(236, 72, 153)  /* pink-500 */
Accent: rgb(220, 38, 38)      /* red-600 */

Light BG: rgb(255, 241, 242)  /* rose-50 */
Light BG 2: rgb(252, 231, 243)/* pink-50 */

Gray: rgb(75, 85, 99)         /* gray-600 */
```

---

## ✨ Animations

```css
@keyframes float
  └─ 0% → 50% → 100%: translateY(0 → -10px → 0)
    └─ Duration: 3s infinite

@keyframes glow
  └─ 0% → 50% → 100%: box-shadow opacity
    └─ Duration: 2s infinite

@keyframes heartbeat
  └─ 0% → 25% → 50% → 100%: scale(1 → 1.1 → 1 → 1)
    └─ Duration: 1.5s infinite
```

---

## 📦 Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| next | Framework | 16.2.6 |
| react | UI Library | 19 |
| typescript | Type Safety | 5.7.3 |
| tailwindcss | Styling | 4.2.0 |
| mysql2 | Database | 3.22.6 |
| jsonwebtoken | JWT | 9.0.3 |
| bcryptjs | Hashing | 3.0.3 |
| @vercel/blob | Storage | 2.6.1 |
| lucide-react | Icons | 1.16.0 |
| js-cookie | Cookies | 3.0.8 |

---

## 🔧 NPM Scripts

```bash
pnpm dev       # Start development server (port 3000)
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

---

## 🚀 Environment Variables

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=couple_app

# JWT Secret
JWT_SECRET=your_secret_key_here_min_32_chars

# Vercel Blob (Optional)
VERCEL_BLOB_TOKEN=your_blob_token_here
```

---

## 📝 Component Props Examples

### AlbumList
```typescript
<AlbumList token={authToken} />
```

### LetterList
```typescript
<LetterList token={authToken} />
```

### EventList
```typescript
<EventList token={authToken} />
```

### AlbumModal
```typescript
<AlbumModal
  isOpen={true}
  onClose={() => setOpen(false)}
  onCreate={(data) => handleCreate(data)}
/>
```

---

## 🔄 Data Flow Examples

### Login Flow
```
Input passcode → POST /api/auth/login → Verify in DB → 
Generate JWT → Store in cookie → Redirect to dashboard
```

### Create Letter
```
Fill form → POST /api/letters → Get letter_id → 
Upload audio/images → POST /api/attachments → 
Update LetterList
```

### Scheduled Unlock
```
LetterDetail checks: new Date() >= scheduled_unlock_date →
If true: Show content & mark as opened →
If false: Show "🔒 Khóa"
```

---

## 🎯 Common Tasks

### Add a new field to users
1. Edit: `scripts/init-db.js` → ALTER TABLE query
2. Run: `node scripts/init-db.js`
3. Update type in: `lib/auth-context.tsx`

### Add a new API endpoint
1. Create: `app/api/[resource]/route.ts`
2. Export: `export async function POST(request) { ... }`
3. Call from frontend: `fetch('/api/[resource]', { method: 'POST' })`

### Add a new component
1. Create: `components/[ComponentName].tsx`
2. Import in parent: `import { ComponentName } from '@/components'`
3. Use: `<ComponentName prop={value} />`

### Update styling
1. Edit: `app/globals.css` (global)
2. Or: Use inline Tailwind classes
3. Or: Add @keyframes for animations

### Fix a bug
1. Enable: `console.log("[v0] ...")` statements
2. Check: Dev server output or browser console
3. Fix code
4. Remove: console.log statements

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `PORT=3001 pnpm dev` |
| MySQL connection error | Check credentials in `.env.local` |
| Build fails | Run `pnpm install` again |
| TypeScript errors | Check `tsconfig.json` |
| Styling not applied | Check class name spelling in Tailwind |
| API 404 errors | Check route structure in `app/api/` |
| Login not working | Check passcode in DB |
| Files not uploading | Check Vercel Blob token |
| Animations not smooth | Check GPU acceleration browser settings |

---

## 📊 Useful SQL Queries

### Check if tables exist
```sql
SHOW TABLES IN couple_app;
```

### View all users
```sql
SELECT id, email, full_name, role FROM users;
```

### Check all albums
```sql
SELECT * FROM albums ORDER BY created_at DESC;
```

### Find letters with scheduled unlock
```sql
SELECT * FROM letters WHERE scheduled_unlock_date IS NOT NULL;
```

### Count photos in album
```sql
SELECT album_id, COUNT(*) as count FROM photos GROUP BY album_id;
```

---

## 💡 Best Practices

✅ Always verify JWT before API operations
✅ Hash passwords with bcryptjs (10 rounds)
✅ Use prepared statements to prevent SQL injection
✅ Validate file types before upload
✅ Use CORS headers for API security
✅ Keep JWT secret in `.env` (never commit)
✅ Test on multiple screen sizes
✅ Check console for errors before deployment
✅ Use TypeScript for type safety
✅ Write meaningful commit messages

---

Chúc bạn phát triển tốt! 💕
