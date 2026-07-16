# Hướng Dẫn Cập Nhật VPS từ Windows

Hướng dẫn này giúp bạn cập nhật code từ Windows lên VPS một cách dễ dàng.

## 3 Cách Cập Nhật

### Cách 1: Git (Recommended - Dễ Nhất)

Nếu đã setup Git:

#### Bước 1: Commit thay đổi trên Windows
```bash
# Mở PowerShell/CMD trên folder project
cd C:\path\to\project

# Stage changes
git add .

# Commit
git commit -m "Update: Cuong Vy customization"

# Push lên repository
git push origin main
```

#### Bước 2: Pull trên VPS
```bash
# SSH vào VPS
ssh appuser@your_vps_ip

# Vào project folder
cd /home/appuser/your-project

# Pull code mới
git pull origin main

# Install dependencies (nếu có package.json changes)
pnpm install

# Rebuild
pnpm build

# Restart application
pm2 restart all
```

**Lợi thế:**
- Nhanh nhất (chỉ download thay đổi)
- Dễ track version
- Có thể rollback nếu cần

---

### Cách 2: SCP (Secure Copy)

Nếu không dùng Git, copy file trực tiếp:

#### Bước 1: Chuẩn Bị Trên Windows
```bash
# Mở PowerShell trên folder project
# Hoặc dùng Git Bash

# Chỉ copy source code (không cần node_modules/.next)
# Tạo folder temp
mkdir temp_upload
xcopy /E /I app temp_upload\app
xcopy /E /I components temp_upload\components
xcopy /E /I lib temp_upload\lib
xcopy /E /I scripts temp_upload\scripts
xcopy /E /I public temp_upload\public

# Copy config files
copy package.json temp_upload\
copy next.config.mjs temp_upload\
copy .env.local temp_upload\
copy tailwind.config.ts temp_upload\ 2>nul || true
copy tsconfig.json temp_upload\
copy postcss.config.mjs temp_upload\
```

#### Bước 2: Upload lên VPS
```bash
# Từ PowerShell trên Windows:

# Upload to VPS
scp -r temp_upload/* appuser@your_vps_ip:/home/appuser/your-project/

# Hoặc gunakan WinSCP (GUI):
# - Open WinSCP
# - New Session: appuser@your_vps_ip
# - Drag and drop files
```

#### Bước 3: Update trên VPS
```bash
# SSH vào VPS
ssh appuser@your_vps_ip
cd /home/appuser/your-project

# Install (nếu cần)
pnpm install

# Build
pnpm build

# Restart
pm2 restart all
```

---

### Cách 3: ZIP Upload (Backup Method)

Backup method nếu SCP/Git không hoạt động:

#### Bước 1: Tạo ZIP trên Windows
```bash
# PowerShell: Nén project

# Option 1: Compress-Archive (PowerShell)
Compress-Archive -Path "C:\path\to\project" -DestinationPath "C:\path\to\project.zip"

# Option 2: 7-Zip hoặc WinRAR
# Clic chuột phải > 7-Zip > Add to archive
# Chỉ chọn folders: app, components, lib, scripts, public + files
```

#### Bước 2: Upload ZIP
```bash
# SCP upload ZIP
scp C:\path\to\project.zip appuser@your_vps_ip:/home/appuser/

# Hoặc dùng WinSCP
```

#### Bước 3: Extract và Update trên VPS
```bash
ssh appuser@your_vps_ip

# Extract
cd /home/appuser
unzip project.zip -d your-project

# Hoặc nếu là từng folder:
# unzip -o /home/appuser/project.zip -d /home/appuser/your-project/

# Update
cd /home/appuser/your-project
pnpm install
pnpm build
pm2 restart all
```

---

## Kiểm Tra Thay Đổi Sau Update

```bash
# SSH vào VPS
ssh appuser@your_vps_ip

# Check PM2 status
pm2 status

# Check logs real-time
pm2 logs app-name

# Check if running
curl http://localhost:3000

# Check header (should see new title)
curl -I http://localhost:3000
```

---

## Troubleshooting

### Build fails
```bash
# Clear cache
rm -rf .next
pnpm install
pnpm build
```

### Port error
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Restart PM2
pm2 restart all
```

### Permission denied
```bash
# Fix permissions
sudo chown -R appuser:appuser /home/appuser/your-project

# Then retry
pnpm install
pnpm build
```

### Dependencies error
```bash
# Clear pnpm cache
pnpm store prune
pnpm install

# Rebuild
pnpm build
```

---

## Quick Update Script

Create file `update.sh` locally and run on VPS:

```bash
#!/bin/bash

# SSH into VPS and run this
cd /home/appuser/your-project

echo "📥 Installing dependencies..."
pnpm install

echo "🔨 Building..."
pnpm build

echo "🔄 Restarting..."
pm2 restart all

echo "✅ Update complete!"
echo "Checking status..."
pm2 status
```

Run:
```bash
ssh appuser@your_vps_ip 'bash -s' < update.sh
```

---

## Recommended: Git Method

### Setup Git (First Time)

```bash
# On Windows:
git init
git remote add origin https://github.com/your-user/your-repo.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main

# On VPS (first time):
cd /home/appuser
git clone https://github.com/your-user/your-repo.git your-project
cd your-project
pnpm install
pnpm build
pm2 start ecosystem.config.js
```

### Regular Updates with Git

```bash
# Windows: Make changes, commit, push
git add .
git commit -m "Update: [description]"
git push

# VPS: Pull and update
ssh appuser@your_vps_ip

cd /home/appuser/your-project
git pull
pnpm install  # Only if package.json changed
pnpm build
pm2 restart all
```

---

## File Transfer Speed Comparison

| Method | Speed | Setup | Pros | Cons |
|--------|-------|-------|------|------|
| Git | ⚡⚡ Fast | Moderate | Only changes, easy rollback | Need Git setup |
| SCP | ⚡ Fast | Simple | Direct copy, no Git needed | Copies all files |
| ZIP | ⚡ Medium | Simple | Good for large changes | Needs compression |

---

## Pre-Update Checklist

- [ ] All changes committed locally
- [ ] Tested locally with `pnpm dev`
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] .env.local updated if needed
- [ ] Database credentials ready
- [ ] SSH access to VPS working

---

## Post-Update Checklist

- [ ] Build completed without errors
- [ ] PM2 shows app running
- [ ] Website accessible via IP:3000
- [ ] Login page shows "Cuong <3 Vy's Home"
- [ ] Can login with passcode (281120 or 090803)
- [ ] Dashboard loads
- [ ] Test one feature (create album, etc)
- [ ] Check PM2 logs for errors
- [ ] Monitor for 5 minutes

---

## Common Issues & Solutions

### "git: command not found"
```bash
# Install Git on VPS
sudo apt update
sudo apt install -y git
```

### "Permission denied (publickey)"
```bash
# SSH key not setup
# Generate key on Windows (Git Bash):
ssh-keygen -t ed25519

# Add to VPS authorized_keys
cat ~/.ssh/id_ed25519.pub | ssh appuser@vps 'cat >> ~/.ssh/authorized_keys'
```

### "pnpm: command not found"
```bash
# Install pnpm on VPS
sudo npm install -g pnpm
```

### Build takes too long
```bash
# VPS may have low resources
# Check memory
free -h

# Kill unused processes
ps aux | grep node
# Kill unnecessary processes
```

---

Chọn Cách 1 (Git) để dễ nhất! 🚀
