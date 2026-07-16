# 🚀 VPS Deployment - Quick Guide (Chỉ 15 Phút)

Hướng dẫn nhanh deploy lên VPS Ubuntu trong 15 phút.

---

## 📋 Yêu Cầu Tối Thiểu

- VPS chạy **Ubuntu 20.04+**
- SSH access (root hoặc sudo)
- 2GB RAM, 10GB disk

---

## ⚡ Quick 15-Minute Setup

### 1️⃣ SSH vào VPS & Create User (2 phút)

```bash
# SSH vào VPS
ssh root@your_vps_ip

# Create non-root user
adduser appuser
usermod -aG sudo appuser
su - appuser
```

### 2️⃣ Install Node.js & pnpm (3 phút)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Verify
node --version
pnpm --version
```

### 3️⃣ Install MySQL (2 phút)

```bash
# Install MySQL
sudo apt update
sudo apt install -y mysql-server

# Secure installation (skip if want default)
# sudo mysql_secure_installation
```

### 4️⃣ Setup Database (2 phút)

```bash
# Create database
sudo mysql -u root << EOF
CREATE DATABASE couple_app;
CREATE USER 'couple_user'@'localhost' IDENTIFIED BY 'strong_pass_123';
GRANT ALL PRIVILEGES ON couple_app.* TO 'couple_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 5️⃣ Upload Project (2 phút)

**Option A: Git Clone**
```bash
cd /home/appuser
git clone https://your-repo.git app
cd app
```

**Option B: Upload ZIP**
```bash
# Unzip project ke /home/appuser/app
cd /home/appuser/app
```

### 6️⃣ Configure & Build (2 phút)

```bash
# Create .env.local
nano .env.local

# Add:
MYSQL_HOST=localhost
MYSQL_USER=couple_user
MYSQL_PASSWORD=strong_pass_123
MYSQL_DATABASE=couple_app
JWT_SECRET=random_string_at_least_32_chars_long
NODE_ENV=production
PORT=3000
```

**Nhấn: Ctrl+X, Y, Enter để lưu**

### 7️⃣ Initialize & Build (2 phút)

```bash
# Install dependencies
pnpm install

# Initialize database
node scripts/init-db.js

# Build
pnpm build
```

### ✅ Test Xong!

```bash
# Start ứng dụng
npm start

# Truy cập: http://your_vps_ip:3000
# Passcode: 281120 (Anh) hoặc 090803 (Em)
```

---

## 🎯 Sau 15 Phút - Setup Production (Tùy Chọn)

### 1. Cài PM2 (Chạy 24/7)

```bash
# Cài PM2
sudo npm install -g pm2

# Tạo ecosystem.config.js (copy từ project)
pm2 start ecosystem.config.js
pm2 save
```

### 2. Cài Nginx (Reverse Proxy)

```bash
# Cài Nginx
sudo apt install -y nginx

# Copy config
sudo cp nginx-config.conf /etc/nginx/sites-available/tinhy-au
sudo ln -s /etc/nginx/sites-available/tinhy-au /etc/nginx/sites-enabled/

# Edit domain trong config
sudo nano /etc/nginx/sites-available/tinhy-au
# Thay your_domain.com bằng domain của bạn

# Restart
sudo systemctl restart nginx
```

### 3. Setup SSL (Let's Encrypt)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo certificate
sudo certbot certonly --nginx -d your_domain.com

# Certificate sẽ auto-renew
```

---

## 📋 Command Reference

```bash
# Start
npm start                    # Direct start
pm2 start ecosystem.config.js   # With PM2

# Status
pm2 status
pm2 monit

# Logs
pm2 logs tinhy-au
tail -f /var/log/pm2/app-combined.log

# Restart
pm2 restart tinhy-au
sudo systemctl restart nginx

# Stop
pm2 stop tinhy-au
pm2 delete tinhy-au

# Update
git pull
pnpm install
pnpm build
pm2 restart tinhy-au
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cannot connect to MySQL | Check: `sudo systemctl status mysql` |
| Port 3000 in use | Kill: `sudo lsof -i :3000` then `kill -9 <PID>` |
| Permission denied | Run: `sudo chown -R appuser:appuser /home/appuser/app` |
| Nginx connection refused | Check: `pm2 status` - app must be running |
| Module not found | Run: `pnpm install` again |

---

## 🔗 Full Documentation

For detailed information, see:
- **VPS_DEPLOYMENT.md** - Full 16-part guide
- **QUICK_START.md** - Local development setup
- **ARCHITECTURE.md** - Technical details

---

## ✨ You're Done!

Your app is now running on VPS! 🎉

- Access: http://your_domain_or_ip
- Login: Passcode 281120 or 090803
- Logs: pm2 logs tinhy-au

---

**Questions? Check VPS_DEPLOYMENT.md for detailed instructions.**
