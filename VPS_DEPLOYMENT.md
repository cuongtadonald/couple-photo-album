# 🚀 Hướng Dẫn Deploy Lên VPS Ubuntu Linux

Tài liệu này sẽ hướng dẫn bạn setup ứng dụng Tình Yêu Của Chúng Ta trên VPS Ubuntu từ A-Z.

---

## 📋 Yêu Cầu

- **VPS chạy Ubuntu 20.04 LTS** hoặc cao hơn
- **Root hoặc sudo access**
- **Ít nhất 2GB RAM** (khuyên 4GB+)
- **Ít nhất 10GB disk space**
- **SSH access** đến VPS

---

## 🔧 Phần 1: Chuẩn Bị VPS

### Bước 1: Kết Nối SSH

```bash
# Từ máy tính của bạn
ssh root@your_vps_ip_address

# Hoặc nếu dùng port khác
ssh -p 2222 root@your_vps_ip_address
```

### Bước 2: Update Hệ Thống

```bash
# Update package lists
apt update
apt upgrade -y

# Install essential tools
apt install -y build-essential curl wget git nano
```

### Bước 3: Tạo User Riêng (Bảo Mật)

```bash
# Tạo user mới (không phải root)
adduser appuser

# Thêm vào sudoers group
usermod -aG sudo appuser

# Switch sang user mới
su - appuser
```

---

## 🟢 Phần 2: Cài Đặt Node.js & npm/pnpm

### Cách 1: NodeSource Repository (Khuyến Khích)

```bash
# Download setup script cho Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài đặt Node.js (bao gồm npm)
sudo apt install -y nodejs

# Kiểm tra version
node --version
npm --version

# Output sẽ như: v20.x.x và 10.x.x
```

### Cách 2: Từ Node.js Official

```bash
# Download Node.js binary
cd /tmp
wget https://nodejs.org/dist/v20.x.x/node-v20.x.x-linux-x64.tar.xz

# Extract
tar -xf node-v20.x.x-linux-x64.tar.xz
sudo mv node-v20.x.x-linux-x64 /usr/local/node

# Setup PATH
echo 'export PATH=/usr/local/node/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Cài Đặt pnpm (Package Manager Nhanh)

```bash
# Cài pnpm globally
npm install -g pnpm

# Kiểm tra
pnpm --version
```

---

## 💾 Phần 3: Cài Đặt MySQL

### Bước 1: Cài MySQL Server

```bash
# Cài MySQL
sudo apt install -y mysql-server

# Kiểm tra status
sudo systemctl status mysql

# Output: should show "active (running)"
```

### Bước 2: Secure MySQL Installation

```bash
# Chạy script bảo mật
sudo mysql_secure_installation

# Trả lời các câu hỏi:
# - Set root password? Yes (y)
# - Remove anonymous users? Yes (y)
# - Disable remote root login? Yes (y)
# - Remove test database? Yes (y)
# - Reload privilege tables? Yes (y)
```

### Bước 3: Tạo Database & User

```bash
# Login vào MySQL
sudo mysql -u root

# Thực hiện các câu lệnh SQL:
# Tạo database
CREATE DATABASE couple_app;

# Tạo user mới (không phải root)
CREATE USER 'couple_user'@'localhost' IDENTIFIED BY 'strong_password_here';

# Cấp quyền
GRANT ALL PRIVILEGES ON couple_app.* TO 'couple_user'@'localhost';
FLUSH PRIVILEGES;

# Kiểm tra
SHOW DATABASES;

# Thoát
EXIT;
```

### Bước 4: Kiểm Tra Kết Nối

```bash
# Test login với user mới
mysql -u couple_user -p couple_app

# Nếu thành công, bạn sẽ vào MySQL prompt
# Thoát: EXIT;
```

---

## 📁 Phần 4: Upload Project Lên VPS

### Cách 1: Git Clone (Nhanh & Dễ)

```bash
# Di chuyển vào thư mục app
cd /home/appuser
mkdir -p applications
cd applications

# Clone project từ GitHub (nếu bạn có GitHub repo)
git clone https://github.com/your-username/tinhy-au-cua-chung-ta.git app

# Di chuyển vào folder
cd app
```

### Cách 2: SCP Upload (Nếu không có GitHub)

```bash
# Từ máy tính của bạn, gzip project
cd /path/to/project
tar -czf app.tar.gz .

# Upload lên VPS
scp app.tar.gz appuser@your_vps_ip:/home/appuser/

# Trên VPS, extract
cd /home/appuser
tar -xzf app.tar.gz
mv app app-project
cd app-project
```

### Cách 3: SFTP Upload

```bash
# Sử dụng FileZilla hoặc WinSCP
# Connect: sftp://your_vps_ip (port 22)
# Username: appuser
# Password: [your password]
# Upload folder to: /home/appuser/
```

---

## ⚙️ Phần 5: Cấu Hình Environment

### Bước 1: Tạo .env.local

```bash
# Di chuyển vào folder project
cd /home/appuser/app-project

# Tạo file .env.local
nano .env.local
```

### Bước 2: Nhập Nội Dung

```
# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=couple_user
MYSQL_PASSWORD=strong_password_here
MYSQL_DATABASE=couple_app

# JWT Secret (tạo random string dài)
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters_long_abc123xyz

# Optional: Vercel Blob Token (để upload files)
# VERCEL_BLOB_TOKEN=your_token_here

# Node Environment
NODE_ENV=production

# Port
PORT=3000
```

### Bước 3: Lưu File

```
# Nhấn: Ctrl + X
# Trả lời: Y (Yes)
# Nhấn: Enter (để lưu tên file là .env.local)
```

---

## 📦 Phần 6: Khởi Tạo Database

### Bước 1: Cài Dependencies

```bash
# Đảm bảo đang ở trong folder project
cd /home/appuser/app-project

# Cài tất cả dependencies
pnpm install

# Kết quả: "added 150 packages" hoặc tương tự
```

### Bước 2: Chạy Init Script

```bash
# Tạo database tables & insert 2 accounts
node scripts/init-db.js

# Output sẽ hiển thị:
# Database initialized successfully!
# Pre-created accounts added successfully!
```

### Bước 3: Kiểm Tra Database

```bash
# Login vào MySQL
mysql -u couple_user -p couple_app

# Xem các bảng
SHOW TABLES;

# Xem users
SELECT * FROM users;

# Thoát
EXIT;
```

---

## 🏗️ Phần 7: Build Production

### Bước 1: Build Next.js

```bash
# Đảm bảo ở trong folder project
cd /home/appuser/app-project

# Build production
pnpm build

# Output cuối cùng sẽ hiển thị:
# ✓ Compiled successfully
# ✓ Linting and type checking
```

### Bước 2: Kiểm Tra Build

```bash
# Xem folder .next (output của build)
ls -la .next

# Nên có file: .next/server, .next/static, etc.
```

---

## 🎯 Phần 8: Setup PM2 (Process Manager)

PM2 sẽ giữ ứng dụng chạy 24/7 và restart khi server reboot.

### Bước 1: Cài PM2 Globally

```bash
# Cài PM2
sudo npm install -g pm2

# Setup PM2 autostart
pm2 startup

# Làm theo hướng dẫn (copy và paste câu lệnh được output)
```

### Bước 2: Tạo PM2 Config File

```bash
# Di chuyển vào project folder
cd /home/appuser/app-project

# Tạo file ecosystem.config.js
nano ecosystem.config.js
```

### Bước 3: Nhập PM2 Config

```javascript
module.exports = {
  apps: [
    {
      name: 'tinhy-au',
      script: 'npm',
      args: 'start',
      cwd: '/home/appuser/app-project',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/app-error.log',
      out_file: '/var/log/pm2/app-out.log',
      log_file: '/var/log/pm2/app-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```

### Bước 4: Start Ứng Dụng với PM2

```bash
# Start ứng dụng
pm2 start ecosystem.config.js

# Kiểm tra status
pm2 status

# Output:
# ┌─────┬──────────┬─────────┬─────────┬────────┬─────────┐
# │ id  │ name     │ version │ mode    │ status │ restart │
# ├─────┼──────────┼─────────┼─────────┼────────┼─────────┤
# │ 0   │ tinhy-au │ N/A     │ cluster │ online │ 0       │
# └─────┴──────────┴─────────┴─────────┴────────┴─────────┘

# Xem logs
pm2 logs tinhy-au

# Save PM2 config để auto-restart khi reboot
pm2 save
```

---

## 🌐 Phần 9: Cấu Hình Nginx (Reverse Proxy)

Nginx sẽ đứng phía trước ứng dụng, nhận request HTTP và forward sang Node.js.

### Bước 1: Cài Nginx

```bash
# Cài Nginx
sudo apt install -y nginx

# Kiểm tra status
sudo systemctl status nginx

# Output: should show "active (running)"
```

### Bước 2: Tạo Nginx Config

```bash
# Tạo config file mới
sudo nano /etc/nginx/sites-available/tinhy-au
```

### Bước 3: Nhập Nginx Config

```nginx
upstream tinhy_au_app {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your_domain.com www.your_domain.com;

  # Giới hạn body size upload
  client_max_body_size 50M;

  # Proxy settings
  location / {
    proxy_pass http://tinhy_au_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Caching for static files
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
  }

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/xml text/javascript
             application/x-javascript application/xml+rss
             application/javascript application/json;
  gzip_min_length 1000;
}
```

### Bước 4: Enable Site

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/tinhy-au /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Output: "successful" hoặc "ok"

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Phần 10: SSL Certificate (HTTPS) - Optional

Nếu bạn có domain name, hãy setup SSL để bảo mật.

### Cách 1: Dùng Let's Encrypt (Miễn Phí)

```bash
# Cài Certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo certificate
sudo certbot certonly --nginx -d your_domain.com -d www.your_domain.com

# Follow prompts:
# - Nhập email: your_email@example.com
# - Agree to terms: Y
# - Newsletter: N (or Y, tùy thích)

# Output sẽ cho biết path của certificates
```

### Cách 2: Update Nginx Config Cho HTTPS

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/tinhy-au

# Thêm vào (sau server block):
server {
  listen 443 ssl http2;
  server_name your_domain.com www.your_domain.com;

  ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

  # Rest of config same as above...
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name your_domain.com www.your_domain.com;
  return 301 https://$server_name$request_uri;
}
```

### Cách 3: Restart Nginx

```bash
# Test config
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

---

## 🧪 Phần 11: Test Ứng Dụng

### Bước 1: Kiểm Tra Ứng Dụng Đang Chạy

```bash
# Check PM2 status
pm2 status

# Xem logs
pm2 logs tinhy-au

# Check port 3000
sudo netstat -tlnp | grep 3000

# Output: node... 127.0.0.1:3000
```

### Bước 2: Test từ Local Machine

```bash
# SSH tunnel nếu muốn test port 3000 trực tiếp
ssh -L 3000:localhost:3000 appuser@your_vps_ip

# Hoặc access qua domain/IP trực tiếp
curl http://your_vps_ip/

# Hoặc mở browser:
# http://your_domain.com
```

### Bước 3: Test Login

- Truy cập: http://your_domain.com hoặc http://your_vps_ip
- Nhập passcode: 2 8 1 1 2 0 (Anh Xãa)
- Hoặc: 0 9 0 8 0 3 (Em Xãa)
- Nếu thành công, bạn sẽ vào dashboard

---

## 📊 Phần 12: Monitoring & Maintenance

### Bước 1: PM2 Monitoring

```bash
# Monitor real-time
pm2 monit

# Hoặc sử dụng PM2 Plus (web UI) - Optional
pm2 web

# Truy cập: http://localhost:9615
```

### Bước 2: Kiểm Tra Logs Hàng Ngày

```bash
# View logs
pm2 logs tinhy-au

# Hoặc xem file logs
tail -f /var/log/pm2/app-combined.log

# Xem last 100 lines
pm2 logs tinhy-au --lines 100
```

### Bước 3: Backup Database

```bash
# Tạo backup
mysqldump -u couple_user -p couple_app > /home/appuser/backups/backup-$(date +%Y%m%d).sql

# Restore từ backup (nếu cần)
mysql -u couple_user -p couple_app < backup-20240101.sql
```

### Bước 4: Update Ứng Dụng

```bash
# Khi có update mới
cd /home/appuser/app-project
git pull

# Hoặc download new version
pnpm install
pnpm build

# Restart PM2
pm2 restart tinhy-au
```

---

## 🚨 Phần 13: Xử Lý Lỗi Thường Gặp

### Lỗi: "Cannot connect to MySQL"

```bash
# Kiểm tra MySQL status
sudo systemctl status mysql

# Nếu không chạy, start nó
sudo systemctl start mysql

# Kiểm tra credentials trong .env.local
cat .env.local | grep MYSQL

# Test kết nối
mysql -u couple_user -p -e "SELECT 1;"
```

### Lỗi: "Port 3000 is already in use"

```bash
# Tìm process đang dùng port 3000
sudo lsof -i :3000

# Kill process (nếu cần)
sudo kill -9 <PID>

# Hoặc restart PM2
pm2 restart tinhy-au
```

### Lỗi: "Permission denied" khi chạy init-db.js

```bash
# Kiểm tra file permissions
ls -la scripts/init-db.js

# Thay đổi permissions nếu cần
chmod +x scripts/init-db.js

# Chạy lại
node scripts/init-db.js
```

### Lỗi: Nginx "Connection Refused"

```bash
# Kiểm tra app đang chạy
pm2 status

# Nếu offline, start lại
pm2 start ecosystem.config.js

# Kiểm tra port 3000 listening
sudo netstat -tlnp | grep 3000
```

### Lỗi: "Too many open files"

```bash
# Tăng file descriptor limit
sudo nano /etc/security/limits.conf

# Thêm vào cuối file:
appuser soft nofile 65535
appuser hard nofile 65535

# Logout và login lại để apply
```

---

## 📋 Phần 14: Checklist Deployment

Sau khi setup xong, hãy check:

```
[✓] Node.js & pnpm cài xong
[✓] MySQL cài xong & database tạo xong
[✓] Project clone/upload lên VPS
[✓] .env.local configured
[✓] init-db.js chạy thành công
[✓] pnpm build compile không lỗi
[✓] PM2 start ứng dụng thành công
[✓] PM2 logs không có error
[✓] Nginx configured & running
[✓] Có thể access ứng dụng từ browser
[✓] Login bằng passcode hoạt động
[✓] Có thể tạo album/letter/event
[✓] Database queries hoạt động
[✓] Static files load bình thường
[✓] HTTPS working (nếu dùng SSL)
```

---

## 🔄 Phần 15: Restart Services (Khi Cần)

```bash
# Restart tất cả services
sudo systemctl restart mysql
sudo systemctl restart nginx
pm2 restart tinhy-au

# Hoặc một lệnh duy nhất
sudo systemctl restart mysql && sudo systemctl restart nginx && pm2 restart tinhy-au

# Check status
sudo systemctl status mysql nginx
pm2 status
```

---

## 📈 Phần 16: Tối Ưu Hóa Performance (Optional)

### Tăng MySQL Performance

```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Thêm vào [mysqld] section:
max_connections=200
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
query_cache_type=1
query_cache_size=64M
```

### Tăng Nginx Performance

```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf

# Trong events block:
worker_processes auto;
worker_connections 2048;

# Enable gzip (được thêm ở config site riêng)
```

### PM2 Clustering

```bash
# PM2 đã configured dùng 'max' instances (cluster mode)
# Nó sẽ dùng tất cả CPU cores

# Kiểm tra
pm2 status

# Sẽ thấy: 0, 1, 2, 3... (multiple instances)
```

---

## 🎯 Quick Command Reference

```bash
# SSH vào VPS
ssh appuser@your_vps_ip

# Di chuyển vào project
cd /home/appuser/app-project

# Start/Stop/Restart ứng dụng
pm2 start ecosystem.config.js
pm2 stop tinhy-au
pm2 restart tinhy-au

# Xem logs
pm2 logs tinhy-au

# Xem status
pm2 status
pm2 monit

# Cập nhật ứng dụng
git pull
pnpm install
pnpm build
pm2 restart tinhy-au

# Backup database
mysqldump -u couple_user -p couple_app > backup.sql

# Restart services
sudo systemctl restart mysql nginx

# Check ports
sudo netstat -tlnp | grep LISTEN

# Check disk space
df -h

# Check memory usage
free -h

# View system logs
sudo journalctl -xe
```

---

## ✨ Tóm Tắt Quá Trình

1. **SSH vào VPS** - Kết nối remote
2. **Update hệ thống** - apt update && apt upgrade
3. **Cài Node.js** - NodeSource repository
4. **Cài pnpm** - npm install -g pnpm
5. **Cài MySQL** - apt install mysql-server
6. **Tạo database & user** - MySQL commands
7. **Upload project** - Git clone hoặc SCP
8. **Configure .env.local** - Database credentials
9. **Chạy init-db.js** - Tạo tables & accounts
10. **Build project** - pnpm build
11. **Setup PM2** - Process manager
12. **Cấu hình Nginx** - Reverse proxy
13. **Test ứng dụng** - Truy cập domain/IP
14. **Setup SSL** - Let's Encrypt (optional)
15. **Monitor & maintain** - Logs, backups

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `pm2 logs tinhy-au`
2. Kiểm tra database: `mysql -u couple_user -p`
3. Kiểm tra Nginx: `sudo nginx -t`
4. Check system: `df -h`, `free -h`
5. Restart services nếu cần

---

**Chúc bạn deploy thành công trên VPS!** 🚀

Nếu có câu hỏi, hãy kiểm tra lại troubleshooting section hoặc xem logs chi tiết.
