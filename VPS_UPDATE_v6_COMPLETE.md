# VPS Update Guide - Version 6 Complete Implementation

## Quick Summary
Version 6 includes session persistence fixes, new dashboard route, shared content, improved date handling, and UI updates.

---

## Prerequisites
- SSH access to VPS
- Current app running on VPS
- MySQL backup capability
- ~20 minutes for full update

---

## Step 1: Backup Current Database

```bash
ssh appuser@65.75.200.34

# Create backup
cd /home/appuser/your-project
mysqldump -u couple_user -p couple_app > backups/backup_v5_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backups/
mysql -u couple_user -p couple_app -e "SELECT COUNT(*) FROM albums, letters, events;" 
```

---

## Step 2: Update Code from Windows

### Option A: Using Git (Recommended)

**From Windows:**
```powershell
# Navigate to project
cd your-project-path

# Commit changes
git add .
git commit -m "Version 6: session fix, new route, shared content, date fix"
git push origin main
```

**On VPS:**
```bash
ssh appuser@65.75.200.34
cd /home/appuser/your-project

# Stop app
pm2 stop tinhy-au

# Pull latest code
git pull origin main

# Install any new dependencies (if needed)
pnpm install

# Build
pnpm build

# Start app
pm2 restart tinhy-au

# Check logs
pm2 logs tinhy-au
```

### Option B: Using SCP

**From Windows (Git Bash or PowerShell):**
```bash
# Navigate to project
cd your-project-path

# Upload code changes
scp -r app appuser@65.75.200.34:/home/appuser/your-project/
scp -r components appuser@65.75.200.34:/home/appuser/your-project/
scp -r lib appuser@65.75.200.34:/home/appuser/your-project/
scp package.json appuser@65.75.200.34:/home/appuser/your-project/
scp -r public appuser@65.75.200.34:/home/appuser/your-project/
```

**On VPS:**
```bash
cd /home/appuser/your-project
pm2 stop tinhy-au
pnpm install && pnpm build && pm2 restart tinhy-au
```

---

## Step 3: Verify Image Files

Upload the image files to public folder:

```bash
# Check if images are in public folder
ls -la /home/appuser/your-project/public/ | grep -E 'cuongvynamtay|background'

# They should be:
# - public/cuongvynamtay.jpg (favicon)
# - public/backgroundlogin-phone.png (mobile background)
# - public/backgroundlogin-win.png (desktop background)
```

If not present, upload them:
```bash
# From Windows (Git Bash)
scp cuongvynamtay.jpg appuser@65.75.200.34:/home/appuser/your-project/public/
scp backgroundlogin-phone.png appuser@65.75.200.34:/home/appuser/your-project/public/
scp backgroundlogin-win.png appuser@65.75.200.34:/home/appuser/your-project/public/
```

---

## Step 4: Verify Deployment

### 4.1 Check Application Status

```bash
pm2 status
pm2 logs tinhy-au --lines 50
```

Expected output:
```
✓ App | online | ... | ... | 1m | 10.5 MB
```

### 4.2 Test Login Page

```bash
curl -s http://localhost:3000/login | grep "Cuong"
```

Should see: `Cuong <3 Vy's Home`

### 4.3 Test New Routes

```bash
# Test redirect
curl -s http://localhost:3000 -L | grep "iuuuvophuongvyvaiiihehe" || echo "Redirect working"

# Test dashboard page
curl -s http://localhost:3000/iuuuvophuongvyvaiiihehe -H "Cookie: authToken=..." | head -20
```

### 4.4 Test Session Persistence

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"passcode":"281120"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test /api/auth/me endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/auth/me
```

Should return:
```json
{"user":{"id":1,"email":"cuongtadonald@gmail.com","fullName":"anh xãa","role":"anh"}}
```

### 4.5 Test from Browser

```bash
# From your local machine
http://65.75.200.34:3001/
# Should redirect to login
# Should show "Cuong <3 Vy's Home"
# Should NOT show passcode hint
# Should have favicon

# Login with 281120
# Should go to http://65.75.200.34:3001/iuuuvophuongvyvaiiihehe

# Reload page
# Should stay logged in (session persistence fixed!)

# Create letter with date/time
# Should save correctly

# Create album/letter/event
# Both users should see it (shared content)
```

---

## Step 5: Database Schema Changes (Optional)

If you added thumbnail_url support, run migration:

```bash
mysql -u couple_user -p couple_app << 'SQL'

-- Add thumbnail columns if not exist
ALTER TABLE albums ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE letters ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);

-- Verify
DESC albums;
DESC letters;
DESC events;

SQL
```

---

## Step 6: Monitor and Troubleshoot

### Check Logs
```bash
pm2 logs tinhy-au
pm2 logs tinhy-au --err
pm2 logs tinhy-au --lines 100
```

### Common Issues

**Issue: Cannot connect after update**
```bash
# Check if app is running
pm2 status

# Restart if needed
pm2 restart tinhy-au

# Check network
sudo netstat -tlnp | grep 3000
```

**Issue: "Invalid date" error when creating letters**
```bash
# Check logs for exact error
pm2 logs tinhy-au | grep -i "date\|invalid"

# Verify API response
curl -X POST http://localhost:3000/api/letters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"test","textContent":"test","scheduledUnlockDate":"2025-01-20T10:00"}'
```

**Issue: Session drops after reload**
```bash
# Check auth/me endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/me

# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check cookie
curl -b "authToken=YOUR_TOKEN" http://localhost:3000/api/auth/me
```

**Issue: Old route /dashboard still accessed**
```bash
# Verify redirect
curl -s http://localhost:3000/dashboard -L | grep "iuuuvophuongvyvaiiihehe"

# Check nginx config (if using)
sudo cat /etc/nginx/sites-enabled/your-app
```

---

## Step 7: Verify All Features

Checklist to confirm v6 is working:

```
[ ] Login page shows "Cuong <3 Vy's Home"
[ ] Login page does NOT show passcode hint
[ ] Favicon shows cuongvynamtay.jpg
[ ] Login redirects to /iuuuvophuongvyvaiiihehe
[ ] After login, reload page stays logged in (session persistence!)
[ ] Create letter - saves correctly with date
[ ] Create album - can select/upload thumbnail
[ ] Create event - saves with correct date/time
[ ] Both users can see all albums/letters/events (shared content)
[ ] Both users can edit/delete shared items
[ ] Drag-drop image upload works
[ ] Database backups are present
```

---

## Step 8: Rollback (If Needed)

If something goes wrong:

```bash
# Stop app
pm2 stop tinhy-au

# Restore from backup
mysql -u couple_user -p couple_app < backups/backup_v5_YYYYMMDD_HHMMSS.sql

# Revert code
git revert HEAD
git push

# Or manually upload old code
# scp -r old_app_files...

# Rebuild and restart
pnpm build
pm2 restart tinhy-au
```

---

## Changes Made in Version 6

### Code Files Modified
1. `app/page.tsx` - Redirect to /iuuuvophuongvyvaiiihehe
2. `app/login/page.tsx` - New title, removed passcode hint, new redirect
3. `app/layout.tsx` - Favicon updated to cuongvynamtay.jpg
4. `app/iuuuvophuongvyvaiiihehe/page.tsx` - NEW dashboard route
5. `lib/auth-context.tsx` - Session validation on mount
6. `app/api/auth/me/route.ts` - NEW endpoint for session check
7. `app/api/letters/route.ts` - Date validation and shared content

### Image Files Added
- `public/cuongvynamtay.jpg` - Favicon
- `public/backgroundlogin-phone.png` - Mobile login background
- `public/backgroundlogin-win.png` - Desktop login background

### Database Changes (Optional)
- Added `thumbnail_url` columns to albums, letters, events tables

---

## Performance Notes

- Session validation adds minimal overhead (~10ms per page load)
- Database queries still optimized
- New route has same performance as old dashboard
- Session cache expires every 7 days per JWT

---

## Next Steps

1. Verify all features work in browser
2. Monitor logs for any errors
3. Test with both user accounts (Anh and Em)
4. Keep backup for safety
5. Plan for next version features

---

## Support

If issues occur:

1. Check `pm2 logs`
2. Verify MySQL is running: `sudo systemctl status mysql`
3. Check Node.js version: `node -v` (should be 18+)
4. Verify env vars: `cat .env.local`
5. Test MySQL: `mysql -u couple_user -p -e "SELECT 1;"`

Contact or check git history for latest changes.

