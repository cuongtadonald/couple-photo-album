# Version 6 Migration Guide - Cuong <3 Vy's Home

## Overview
This document outlines all changes for Version 6, including database schema updates, code changes, and deployment steps.

## Changes Summary

### 1. Database Schema Changes
- Added `thumbnail_url` column to albums, letters, and events
- Changed all content to be shared (removed user_id restrictions)
- Updated relationships for shared content

### 2. Code Changes
- Added `/iuuuvophuongvyvaiiihehe` dashboard route
- Fixed auth session persistence
- Fixed letter date validation
- Improved image upload functionality
- Updated login page UI

### 3. UI/UX Updates
- Favicon: cuongvynamtay.jpg
- Login title: "Cuong <3 Vy's Home"
- Responsive backgrounds for login page
- Thumbnail selection for media

---

## Step-by-Step Migration

### Part 1: Database Migration (On VPS)

#### 1.1 Backup Current Database
```bash
mysqldump -u couple_user -p couple_app > backup_v5_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Download Migration Script
The migration script (`migrate-v6.sql`) will add new columns and update triggers.

#### 1.3 Run Migration
```bash
mysql -u couple_user -p couple_app < migrate-v6.sql
```

#### 1.4 Verify Migration
```bash
mysql -u couple_user -p couple_app -e "DESC albums;" # Check for thumbnail_url
mysql -u couple_user -p couple_app -e "SELECT * FROM albums LIMIT 1\G"
```

### Part 2: Code Updates (Local)

#### 2.1 Update Image Files
Upload these files to `/public`:
- cuongvynamtay.jpg → favicon
- backgroundlogin-phone.png → mobile background
- backgroundlogin-win.png → desktop background

#### 2.2 Update Code Files
All TypeScript/React files have been updated:
- app/page.tsx - New route /iuuuvophuongvyvaiiihehe
- app/login/page.tsx - Updated UI
- app/api/auth/me - New endpoint for session check
- All API routes for shared content
- All components for thumbnail support

#### 2.3 Install Dependencies (if needed)
```bash
pnpm install # Already included
```

### Part 3: Deploy to VPS

#### 3.1 Push Code to VPS
Using Git:
```bash
git add .
git commit -m "Version 6: shared content, improved auth, new UI"
git push
```

Or using SCP:
```bash
scp -r app components lib scripts public appuser@65.75.200.34:/home/appuser/your-project/
scp package.json .env.local appuser@65.75.200.34:/home/appuser/your-project/
```

#### 3.2 Update on VPS
```bash
ssh appuser@65.75.200.34
cd /home/appuser/your-project

# Stop app
pm2 stop all

# Pull latest code (if using Git)
git pull

# Install dependencies
pnpm install

# Build
pnpm build

# Start app
pm2 restart all

# Check logs
pm2 logs
```

### Part 4: Verification

#### 4.1 Check Services
```bash
pm2 status
```

#### 4.2 Test App
- Navigate to http://65.75.200.34:3001/
- Should redirect to login
- Login with 281120 or 090803
- Should go to http://65.75.200.34:3001/iuuuvophuongvyvaiiihehe
- Reload page - should stay logged in
- Create album/letter/event - should have thumbnail
- Both users can see and edit shared content

#### 4.3 Check Database
```bash
mysql -u couple_user -p couple_app
mysql> SELECT COUNT(*) FROM albums;
mysql> SELECT id, title, thumbnail_url FROM albums LIMIT 5;
mysql> exit
```

---

## File Changes Checklist

### Database Files
- [ ] migrate-v6.sql created and tested

### Code Files Modified
- [ ] app/page.tsx - Redirect logic
- [ ] app/login/page.tsx - New title, remove passcode hint, new backgrounds
- [ ] app/layout.tsx - Favicon link updated
- [ ] lib/auth-context.tsx - Added session validation
- [ ] app/api/auth/me/route.ts - New endpoint
- [ ] app/api/albums/route.ts - Shared content
- [ ] app/api/letters/route.ts - Shared content + date fix
- [ ] app/api/events/route.ts - Shared content
- [ ] components/AlbumDetail.tsx - Thumbnail selection, fixed upload
- [ ] components/LetterModal.tsx - Fixed date handling
- [ ] components/EventModal.tsx - Thumbnail selection
- [ ] All List components - Show shared content
- [ ] public/favicon.ico → cuongvynamtay.jpg

### Image Files
- [ ] cuongvynamtay.jpg uploaded to public/
- [ ] backgroundlogin-phone.png uploaded to public/
- [ ] backgroundlogin-win.png uploaded to public/

---

## Rollback Plan (If Needed)

### Database Rollback
```bash
mysql -u couple_user -p couple_app < backup_v5_YYYYMMDD_HHMMSS.sql
```

### Code Rollback
If using Git:
```bash
git revert HEAD
git push
```

Then on VPS:
```bash
git pull
pnpm build
pm2 restart all
```

---

## Known Limitations

1. Historical data before migration won't have thumbnails (can add manually)
2. Session timeout still 7 days (can extend in JWT options)
3. Shared content means both users see each other's changes

---

## Support

If something breaks:
1. Check `pm2 logs`
2. Check MySQL connection: `mysql -u couple_user -p -e "SELECT 1;"`
3. Check Node.js: `node -v` (should be 18+)
4. Restore from backup if needed

