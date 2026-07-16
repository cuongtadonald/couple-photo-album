# Version 6 Deployment - Step by Step Guide

## Overview
This guide walks you through deploying Version 6 from your Windows machine to the VPS at 65.75.200.34:3001.

**Time Required:** 20-30 minutes  
**Difficulty:** Easy to Medium  
**Backup First:** CRITICAL!

---

## Part 1: Prepare on Windows

### Step 1.1: Gather Required Files

You need these 3 image files. Place them in your project's `public/` folder:

```
your-project/
├── public/
│   ├── cuongvynamtay.jpg              ← Favicon
│   ├── backgroundlogin-phone.png      ← Mobile background
│   └── backgroundlogin-win.png        ← Desktop background
└── ...rest of files
```

**File Descriptions:**
- `cuongvynamtay.jpg`: Your avatar/photo for favicon (32x32px or larger)
- `backgroundlogin-phone.png`: Login page background for mobile phones
- `backgroundlogin-win.png`: Login page background for desktop/laptop

### Step 1.2: Verify Local Changes

Make sure you have the latest code locally:

```bash
# Open PowerShell in your project folder
cd C:\Users\YourName\your-project  # Windows path

# Check status
git status

# Should show:
# - app/page.tsx (modified)
# - app/login/page.tsx (modified)
# - app/layout.tsx (modified)
# - app/iuuuvophuongvyvaiiihehe/page.tsx (new file)
# - lib/auth-context.tsx (modified)
# - app/api/auth/me/route.ts (new file)
# - app/api/letters/route.ts (modified)
# - public/cuongvynamtay.jpg (new file)
# - public/backgroundlogin-phone.png (new file)
# - public/backgroundlogin-win.png (new file)
```

### Step 1.3: Test Locally

Before deploying, test everything on your Windows machine:

```bash
# Start dev server
pnpm dev

# Open browser
http://localhost:3000/

# Test 1: Login page should show "Cuong <3 Vy's Home"
# Test 2: No passcode hint visible
# Test 3: Favicon in tab should be cuongvynamtay.jpg

# Test 4: Login with 281120
# Test 5: Should redirect to http://localhost:3000/iuuuvophuongvyvaiiihehe

# Test 6: Reload page - should stay logged in
# Test 7: Create letter with date - should save

# If all pass, proceed to Step 2
```

### Step 1.4: Commit and Push

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Version 6: session persistence, new route, shared content, UI updates"

# Push to GitHub
git push origin main

# Verify on GitHub
# Go to https://github.com/YOUR_USERNAME/YOUR_REPO
# Should see all changes pushed
```

---

## Part 2: Backup VPS Database

### Step 2.1: SSH into VPS

```bash
# Open PowerShell/Git Bash
ssh appuser@65.75.200.34

# If asked: "Are you sure you want to continue connecting (yes/no)?" 
# Type: yes
```

### Step 2.2: Create Backup

```bash
# Navigate to project
cd /home/appuser/your-project

# Create backups directory if it doesn't exist
mkdir -p backups

# Backup current database
mysqldump -u couple_user -p couple_app > backups/backup_v5_$(date +%Y%m%d_%H%M%S).sql

# You'll be prompted for password
# Enter: (your MySQL password)

# Verify backup created
ls -lh backups/

# Should show:
# backup_v5_20250120_143022.sql (or similar with today's date)
```

### Step 2.3: Verify Backup

```bash
# Count records before update
mysql -u couple_user -p couple_app -e "
  SELECT 'Albums' as Table_Name, COUNT(*) as Count FROM albums
  UNION ALL
  SELECT 'Letters', COUNT(*) FROM letters
  UNION ALL
  SELECT 'Events', COUNT(*) FROM events
  UNION ALL
  SELECT 'Users', COUNT(*) FROM users;
"

# Password: (your MySQL password)

# Should show current counts
```

---

## Part 3: Update Code on VPS

### Option A: Using Git (Recommended)

#### Step 3A.1: Pull Latest Code

```bash
# On VPS, still in your-project folder
git pull origin main

# Should show:
# Updating abc1234..def5678
# Fast-forward
#  app/page.tsx | 2 ++
#  ...more files...
```

#### Step 3A.2: Stop Application

```bash
pm2 stop tinhy-au

# Verify stopped
pm2 status
# Should show: stopped
```

#### Step 3A.3: Install Dependencies

```bash
pnpm install

# Should complete without errors
# If errors, try: pnpm install --force
```

#### Step 3A.4: Build Application

```bash
pnpm build

# Should output:
# ✓ Compiled successfully
# ✓ Generating static pages
```

#### Step 3A.5: Start Application

```bash
pm2 restart tinhy-au

# Verify running
pm2 status
# Should show: online

# Check logs
pm2 logs tinhy-au --lines 20
# Should show no errors
```

### Option B: Using SCP (No Git)

#### Step 3B.1: Upload Code Files

From Windows PowerShell:

```bash
# Navigate to project
cd C:\Users\YourName\your-project

# Upload all necessary files
scp -r app appuser@65.75.200.34:/home/appuser/your-project/
scp -r components appuser@65.75.200.34:/home/appuser/your-project/
scp -r lib appuser@65.75.200.34:/home/appuser/your-project/
scp -r scripts appuser@65.75.200.34:/home/appuser/your-project/
scp -r public appuser@65.75.200.34:/home/appuser/your-project/
scp package.json appuser@65.75.200.34:/home/appuser/your-project/
scp package-lock.json appuser@65.75.200.34:/home/appuser/your-project/ 2>/dev/null || true
scp pnpm-lock.yaml appuser@65.75.200.34:/home/appuser/your-project/ 2>/dev/null || true

# This may take 1-2 minutes depending on file size
```

#### Step 3B.2: On VPS, Rebuild

```bash
# SSH into VPS
ssh appuser@65.75.200.34
cd /home/appuser/your-project

# Stop app
pm2 stop tinhy-au

# Install and build
pnpm install && pnpm build

# Restart
pm2 restart tinhy-au

# Verify
pm2 status
pm2 logs tinhy-au --lines 20
```

---

## Part 4: Verify Image Files

### Step 4.1: Check Files on VPS

```bash
# Still SSH'd into VPS
ls -la /home/appuser/your-project/public/ | grep -E 'cuongvy|background'

# Should show:
# cuongvynamtay.jpg
# backgroundlogin-phone.png
# backgroundlogin-win.png
```

### Step 4.2: If Files Missing

```bash
# From Windows, upload them individually
scp cuongvynamtay.jpg appuser@65.75.200.34:/home/appuser/your-project/public/
scp backgroundlogin-phone.png appuser@65.75.200.34:/home/appuser/your-project/public/
scp backgroundlogin-win.png appuser@65.75.200.34:/home/appuser/your-project/public/

# Verify
ssh appuser@65.75.200.34
ls -la /home/appuser/your-project/public/ | grep -E 'cuongvy|background'
```

---

## Part 5: Verification Tests

### Test 5.1: Application Status

```bash
# On VPS
pm2 status

# Should show:
# id │ name     │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status
# 0  │ tinhy-au │ default     │ 0.1.0   │ cluster │ 12345   │ 30s    │ 0    │ online
```

### Test 5.2: Login Page (from your Windows browser)

```
http://65.75.200.34:3001/
```

Verify:
- [ ] Title shows "Cuong <3 Vy's Home"
- [ ] No passcode hint visible
- [ ] Favicon in browser tab updated
- [ ] Page loads without errors
- [ ] Input fields are styled correctly

### Test 5.3: Test API Endpoints

From Windows PowerShell:

```bash
# Test login
curl -X POST http://65.75.200.34:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"passcode":"281120"}'

# Should return:
# {"user":{"id":1,"email":"cuongtadonald@gmail.com","fullName":"anh xãa","role":"anh"},"token":"eyJ0eXAi..."}

# Save the token for next test
# TOKEN = the long string from "token":"..."

# Test session verification
curl -H "Authorization: Bearer YOUR_TOKEN" http://65.75.200.34:3001/api/auth/me

# Should return:
# {"user":{"id":1,"email":"cuongtadonald@gmail.com","fullName":"anh xãa","role":"anh"}}
```

### Test 5.4: Full User Flow

```
1. Open http://65.75.200.34:3001/ in browser
2. Should redirect to login
3. Enter passcode: 281120
4. Should go to: http://65.75.200.34:3001/iuuuvophuongvyvaiiihehe
5. Reload page (F5)
6. Should STAY on dashboard (session persistence!)
7. NOT redirect to login

8. Create a new letter:
   - Click "Thư Tay" tab
   - Click "+" button
   - Enter title: "Test Letter"
   - Enter content: "This is a test"
   - Select date: tomorrow
   - Click "Gửi Thư"
   - Should save without errors

9. Create a new album:
   - Click "Ảnh Kỷ Niệm" tab
   - Click "+" button
   - Enter title: "Test Album"
   - Click "Tạo"
   - Should appear in list

10. Logout and login as Em (090803):
    - Should see the album and letter you created
    - SHARED CONTENT WORKING!
```

### Test 5.5: Check Logs for Errors

```bash
# On VPS
pm2 logs tinhy-au --lines 100 | grep -i error

# Should show NO errors
# If errors, note them down for troubleshooting
```

---

## Part 6: Common Issues & Solutions

### Issue 1: "Cannot GET /iuuuvophuongvyvaiiihehe"

```bash
# On VPS, verify route exists
curl http://localhost:3000/iuuuvophuongvyvaiiihehe

# If 404, rebuild:
pm2 stop tinhy-au
pnpm build
pm2 restart tinhy-au
pm2 logs tinhy-au
```

### Issue 2: "Session Lost After Reload"

```bash
# Verify /api/auth/me works
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/me

# If fails, check logs:
pm2 logs tinhy-au | grep -i "auth\|session"

# Verify JWT_SECRET is set:
cat /home/appuser/your-project/.env.local | grep JWT_SECRET
```

### Issue 3: "Letter Date Shows Invalid"

```bash
# Check letter API
curl -X POST http://localhost:3000/api/letters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","textContent":"test","scheduledUnlockDate":"2025-01-20T10:00"}'

# Check logs:
pm2 logs tinhy-au | grep -i "letter\|date"
```

### Issue 4: "Old /dashboard URL Still Works"

This is fine - /dashboard still exists for backward compatibility. The main URL is now /iuuuvophuongvyvaiiihehe.

### Issue 5: "Images Not Loading"

```bash
# Verify files exist
ls -la /home/appuser/your-project/public/cuongvynamtay.jpg
ls -la /home/appuser/your-project/public/background*.png

# Check permissions
chmod 644 /home/appuser/your-project/public/cuongvy*
chmod 644 /home/appuser/your-project/public/background*

# Rebuild
pnpm build
pm2 restart tinhy-au
```

---

## Part 7: Rollback (If Needed)

If something goes critically wrong:

```bash
# Stop app
pm2 stop tinhy-au

# Restore database
mysql -u couple_user -p couple_app < backups/backup_v5_20250120_143022.sql

# Revert code (if using Git)
cd /home/appuser/your-project
git revert HEAD
git push

# Or manually restore old files via SCP

# Rebuild and restart
pnpm build
pm2 restart tinhy-au

# Verify
pm2 logs tinhy-au --lines 50
```

---

## Part 8: Post-Deployment Checklist

After deployment, verify everything:

```
[ ] Login page shows "Cuong <3 Vy's Home"
[ ] Passcode hint is removed
[ ] Favicon is updated (cuongvynamtay.jpg)
[ ] Can login with 281120 or 090803
[ ] Redirects to /iuuuvophuongvyvaiiihehe
[ ] Reload page stays logged in (NO redirect to login)
[ ] Can create letters with dates
[ ] Can create albums
[ ] Can create events
[ ] Both users (Anh & Em) see same content
[ ] Both users can edit/delete items
[ ] API endpoints respond correctly
[ ] No errors in pm2 logs
[ ] Database backup exists
[ ] Memory usage is normal
```

---

## Quick Reference Commands

```bash
# SSH into VPS
ssh appuser@65.75.200.34

# Check app status
pm2 status

# View logs
pm2 logs tinhy-au

# Restart app
pm2 restart tinhy-au

# Stop app
pm2 stop tinhy-au

# Start app
pm2 start ecosystem.config.js

# Rebuild
pnpm build

# Check MySQL
mysql -u couple_user -p couple_app -e "SELECT COUNT(*) FROM albums;"

# Test API
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"

# View file
cat /home/appuser/your-project/.env.local

# Check disk space
df -h

# Check memory
free -h
```

---

## Summary

You've successfully deployed Version 6! 🎉

**What's new:**
- ✅ Session persistence (stay logged in)
- ✅ New dashboard URL
- ✅ Fixed letter dates
- ✅ Updated login UI
- ✅ New favicon
- ✅ Shared content between users

**Next steps:**
1. Enjoy your updated app!
2. Test all features thoroughly
3. Monitor logs for any issues
4. Keep backups safe

Good luck! 💪

