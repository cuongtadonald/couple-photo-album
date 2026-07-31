# Quick Update Guide - Cập Nhật Nhanh Windows → VPS

Chọn phương pháp phù hợp của bạn:

---

## 🚀 Cách 1: GIT (Recommended)

### Setup 1 lần (first time only):
```bash
# Windows
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git add .
git commit -m "Initial commit"
git push -u origin main

# VPS
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git your-project
cd your-project
pnpm install
pnpm build
pm2 start ecosystem.config.js
```

### Update (every time after):
```bash
# Windows
git add .
git commit -m "Update: [description]"
git push

# VPS
cd /home/appuser/your-project
git pull
pnpm build
pm2 restart all
```

**Script đơn giản (Windows):**
- Chỉ cần chạy `update-vps.bat` để push
- Sau đó SSH vào VPS chạy `update-vps.sh`

---

## 📤 Cách 2: SCP (No Git needed)

### Option A: Git Bash (Easy)
```bash
# Windows (Git Bash)
VPS_IP="your_vps_ip"
VPS_USER="appuser"
VPS_PATH="/home/appuser/your-project"

# Upload code
scp -r app components lib scripts public $VPS_USER@$VPS_IP:$VPS_PATH/
scp package.json next.config.mjs .env.local $VPS_USER@$VPS_IP:$VPS_PATH/

# Rebuild on VPS
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && pnpm install && pnpm build && pm2 restart all"
```

### Option B: WinSCP (GUI)
1. Open WinSCP
2. Drag-drop folders: app, components, lib, scripts, public
3. Drag-drop files: package.json, next.config.mjs, .env.local
4. Right-click → Open Terminal
5. Run: `pnpm build && pm2 restart all`

---

## ⚡ Cách 3: PowerShell (Windows 11+)

```powershell
$VPS_IP = "your_vps_ip"
$VPS_USER = "appuser"
$VPS_PATH = "/home/appuser/your-project"

# Upload
scp -r "C:\path\to\project\app" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp -r "C:\path\to\project\components" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp -r "C:\path\to\project\lib" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp -r "C:\path\to\project\scripts" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp -r "C:\path\to\project\public" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp "C:\path\to\project\package.json" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"
scp "C:\path\to\project\.env.local" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

# Rebuild
ssh appuser@$VPS_IP "cd $VPS_PATH && pnpm build && pm2 restart all"
```

---

## 📋 Summary - So Sánh 3 Cách

| Tiêu Chí | Git | SCP | PowerShell |
|----------|-----|-----|-----------|
| Setup | Vừa | Dễ | Dễ |
| Mỗi lần update | ⭐⭐ Rất dễ | ⭐ Dễ | ⭐ Dễ |
| Tốc độ | ⚡⚡ Tương đối nhanh | ⚡ Chậm hơn | ⚡ Như SCP |
| Tracking | ✓ Có history | ✗ Không | ✗ Không |
| Recommended | ✅ YES | ✓ Có | - |

---

## 📝 Pre-Update Checklist

- [ ] Code tested locally (`pnpm dev`)
- [ ] No errors in browser console
- [ ] No TypeScript errors
- [ ] Changes committed (if using Git)
- [ ] .env.local credentials correct
- [ ] SSH access to VPS working

---

## ✅ Post-Update Verification

```bash
# SSH to VPS
ssh appuser@your_vps_ip

# Check status
pm2 status

# Check logs
pm2 logs tinhy-au --lines 20

# Test website
curl http://localhost:3000

# Should see "Cuong <3 Vy's Home" in response
curl http://localhost:3000/login | grep -o "Cuong.*Home"
```

---

## 🐛 Common Issues

### "git: command not found"
```bash
# Install on VPS
sudo apt install -y git
```

### "pnpm: command not found"
```bash
# Install on VPS
sudo npm install -g pnpm
```

### Build takes forever
```bash
# Check memory
free -h

# Kill unused processes
ps aux | grep node
# Find PID and kill
kill -9 <PID>
```

### Still can't access
```bash
# Check if PM2 app is running
pm2 status

# If not, restart
pm2 restart all

# Check port 3000
sudo lsof -i :3000

# Check Nginx (if used)
sudo systemctl status nginx
```

---

## 🎯 Recommended Workflow

### First Time Setup
1. **Local:** `git init` & `git remote add origin ...`
2. **Windows:** `git push`
3. **VPS:** `git clone`
4. Done!

### Every Update After
1. **Windows:**
   ```bash
   git add .
   git commit -m "Description"
   git push
   ```

2. **VPS:**
   ```bash
   cd /home/appuser/your-project
   git pull
   pnpm build
   pm2 restart all
   ```

### Or Use Automation Scripts
- **Windows:** Double-click `update-vps.bat` to push
- **VPS:** Run `update-vps.sh` to pull & rebuild

---

## 📚 Full Guides

For detailed instructions:
- **UPDATE_VPS_FROM_WINDOWS.md** - Complete guide (3 methods)
- **SCP_UPLOAD_WINDOWS.md** - SCP detailed guide
- **VPS_DEPLOYMENT.md** - VPS setup guide

---

## 🚀 TL;DR - Just Tell Me What To Do!

### Simple Version (Git):

**Windows:**
```bash
git add . && git commit -m "Update" && git push
```

**VPS:**
```bash
cd /home/appuser/your-project && git pull && pnpm build && pm2 restart all
```

**Done!** ✅

---

## 🆘 Still Confused?

Pick ONE:

1. **I want simplest (Git already setup):** Use Git method
2. **I want to avoid Git setup:** Use WinSCP (drag-drop GUI)
3. **I'm technical:** Use Git or SCP with scripts
4. **I want one-liner:** See "One-liner Upload + Rebuild" in SCP_UPLOAD_WINDOWS.md

---

Good luck! If issues, check the full guides above. 💪
