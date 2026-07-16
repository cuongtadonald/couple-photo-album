# Hướng Dẫn Upload từ Windows sang VPS bằng SCP

Phương pháp này không cần Git - Upload trực tiếp các file thay đổi.

## Yêu Cầu

- Git Bash hoặc PowerShell (Windows 10+)
- SSH access đến VPS
- Biết VPS IP, username, password/key

---

## Phương Pháp 1: Dùng Git Bash (Dễ Nhất)

### Bước 1: Mở Git Bash
```bash
# Right-click trên folder project
# Select "Git Bash Here"
```

### Bước 2: Upload folders
```bash
# Set variables
VPS_IP="your_vps_ip"
VPS_USER="appuser"
VPS_PATH="/home/appuser/your-project"

# Upload source code
scp -r app components lib scripts public $VPS_USER@$VPS_IP:$VPS_PATH/

# Upload config files
scp package.json package-lock.json .env.local next.config.mjs tailwind.config.ts tsconfig.json postcss.config.mjs $VPS_USER@$VPS_IP:$VPS_PATH/
```

### Bước 3: SSH vào VPS và rebuild
```bash
ssh $VPS_USER@$VPS_IP

cd $VPS_PATH
pnpm install
pnpm build
pm2 restart all
```

---

## Phương Pháp 2: Dùng PowerShell (Windows 11)

### Bước 1: Kiểm Tra OpenSSH
```powershell
# Check if OpenSSH is installed
Get-WindowsCapability -Online | Where-Object Name -like '*OpenSSH*'

# If not installed:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### Bước 2: Upload bằng SCP
```powershell
# Set variables
$VPS_IP = "your_vps_ip"
$VPS_USER = "appuser"
$VPS_PATH = "/home/appuser/your-project"
$LOCAL_PATH = "C:\path\to\project"

# Upload folders
scp -r "$LOCAL_PATH\app" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp -r "$LOCAL_PATH\components" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp -r "$LOCAL_PATH\lib" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp -r "$LOCAL_PATH\scripts" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp -r "$LOCAL_PATH\public" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"

# Upload files
scp "$LOCAL_PATH\package.json" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp "$LOCAL_PATH\next.config.mjs" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
scp "$LOCAL_PATH\.env.local" "${VPS_USER}@${VPS_IP}:${VPS_PATH}\"
```

### Bước 3: Rebuild trên VPS
```powershell
ssh appuser@your_vps_ip "cd /home/appuser/your-project && pnpm install && pnpm build && pm2 restart all"
```

---

## Phương Pháp 3: Dùng WinSCP (GUI - Dễ Nhất)

### Bước 1: Tải WinSCP
- Download: https://winscp.net/eng/download.php
- Install bình thường

### Bước 2: Kết Nối
1. Open WinSCP
2. File → New Session
3. Enter:
   - Host name: your_vps_ip
   - User name: appuser
   - Password: your_password (hoặc chọn Key file)
4. Click Login

### Bước 3: Upload Files
1. Left side (Local): Navigate to project folder
2. Right side (VPS): Navigate to `/home/appuser/your-project`
3. Drag and drop folders:
   - app
   - components
   - lib
   - scripts
   - public
4. Drag and drop files:
   - package.json
   - next.config.mjs
   - .env.local
   - tailwind.config.ts
   - tsconfig.json
   - postcss.config.mjs

### Bước 4: Rebuild
1. Open Terminal in WPS (right-click → Open in PuTTY/Terminal)
2. Run commands:
```bash
cd /home/appuser/your-project
pnpm install
pnpm build
pm2 restart all
```

---

## Phương Pháp 4: Script Automation

### Windows Batch Script

Create file `upload-vps.bat`:

```batch
@echo off
setlocal enabledelayedexpansion

set VPS_IP=your_vps_ip
set VPS_USER=appuser
set VPS_PATH=/home/appuser/your-project
set LOCAL_PATH=%CD%

echo Uploading to VPS...

REM Upload folders
scp -r "%LOCAL_PATH%\app" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp -r "%LOCAL_PATH%\components" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp -r "%LOCAL_PATH%\lib" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp -r "%LOCAL_PATH%\scripts" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp -r "%LOCAL_PATH%\public" %VPS_USER%@%VPS_IP%:%VPS_PATH%/

REM Upload files
scp "%LOCAL_PATH%\package.json" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp "%LOCAL_PATH%\next.config.mjs" %VPS_USER%@%VPS_IP%:%VPS_PATH%/
scp "%LOCAL_PATH%\.env.local" %VPS_USER%@%VPS_IP%:%VPS_PATH%/

echo Upload complete! Rebuilding...

REM SSH and rebuild
ssh %VPS_USER%@%VPS_IP% "cd %VPS_PATH% && pnpm install && pnpm build && pm2 restart all"

echo Done!
pause
```

Run:
```bash
# Double-click upload-vps.bat
# Or in Git Bash:
bash upload-vps.bat
```

---

## Verify After Upload

### Check on VPS
```bash
# SSH to VPS
ssh appuser@your_vps_ip

# Check if files uploaded
ls -la /home/appuser/your-project/app/
ls -la /home/appuser/your-project/components/

# Check app status
pm2 status

# Check logs
pm2 logs tinhy-au --lines 20

# Test curl
curl http://localhost:3000
```

---

## Troubleshooting SCP

### "Permission denied"
```bash
# Check file permissions
ls -la ~/.ssh/

# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa

# Try again with verbose
scp -v -r app appuser@vps_ip:/path/
```

### "command not found: scp"
```bash
# Install OpenSSH (Windows)
# Or use WinSCP GUI instead
```

### "Connection refused"
```bash
# Check VPS is online
ping your_vps_ip

# Check SSH is running on VPS
# SSH to VPS from different terminal first
```

### Slow upload
```bash
# Use compression flag
scp -C -r app appuser@vps_ip:/path/

# Or reduce file size before uploading
# Exclude .git, node_modules, .next
```

---

## Khác Biệt: Git vs SCP

| Tiêu Chí | Git | SCP |
|----------|-----|-----|
| Setup | Hơi phức tạp | Đơn giản |
| Tốc độ | ⚡⚡ Nhanh (chỉ changes) | ⚡ Chậm hơn (all files) |
| Tracking | ✓ Full history | ✗ Không |
| Rollback | ✓ Dễ | ✗ Khó |
| Lần đầu | Phức tạp | Đơn giản |
| Lần sau | Dễ | Cơ bản same |

**Khuyến Cáo:** Dùng Git lần đầu, sau đó dùng Git cho tất cả updates.

---

## Quick Reference

### Git Bash Commands
```bash
# Upload
scp -r app components lib scripts public appuser@vps:/path/

# SSH
ssh appuser@vps_ip

# Rebuild on VPS
cd /home/appuser/your-project
pnpm install && pnpm build && pm2 restart all
```

### One-liner Upload + Rebuild
```bash
scp -r app components lib scripts public appuser@vps:/path/ && \
scp package.json .env.local next.config.mjs appuser@vps:/path/ && \
ssh appuser@vps "cd /home/appuser/your-project && pnpm build && pm2 restart all"
```

---

Chọn WinSCP nếu muốn GUI, hoặc Git Bash nếu muốn nhanh! 🚀
