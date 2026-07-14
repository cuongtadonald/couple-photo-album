#!/bin/bash

# MySQL Setup Script for Tình Yêu Của Chúng Ta
# Run this as root: sudo bash setup-mysql.sh

echo "======================================"
echo "🗄️  MySQL Setup Script"
echo "======================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   echo "Usage: sudo bash setup-mysql.sh"
   exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Step 1: Check MySQL installation
print_info "Checking MySQL installation..."
if ! command -v mysql &> /dev/null; then
    print_info "MySQL not found. Installing..."
    apt update
    apt install -y mysql-server
    print_status "MySQL installed"
else
    print_status "MySQL already installed"
fi

# Step 2: Start MySQL
print_info "Starting MySQL service..."
systemctl start mysql
systemctl enable mysql
print_status "MySQL service started"

# Step 3: Run secure installation
print_info "Running MySQL secure installation..."
echo "Note: Answer 'Y' to all questions (except 'Disallow root login remotely')"
mysql_secure_installation

# Step 4: Create database and user
print_info "Creating database and user..."

read -p "Enter MySQL root password: " -s ROOT_PASS
echo
read -p "Enter new username (default: couple_user): " -e DB_USER
DB_USER=${DB_USER:-couple_user}
read -p "Enter new password for $DB_USER: " -s DB_PASS
echo

mysql -u root -p"$ROOT_PASS" << EOF
CREATE DATABASE IF NOT EXISTS couple_app;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON couple_app.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    print_status "Database and user created successfully"
    echo ""
    echo "Credentials:"
    echo "  Database: couple_app"
    echo "  User: $DB_USER"
    echo "  Password: $DB_PASS"
    echo "  Host: localhost"
    echo ""
else
    echo -e "${RED}✗${NC} Error creating database"
    exit 1
fi

# Step 5: Verify connection
print_info "Verifying connection..."
mysql -u "$DB_USER" -p"$DB_PASS" couple_app -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    print_status "Connection verified successfully"
else
    echo -e "${RED}✗${NC} Connection failed"
    exit 1
fi

# Step 6: Show database info
print_info "Current MySQL databases:"
mysql -u root -p"$ROOT_PASS" -e "SHOW DATABASES;"

echo ""
echo "======================================"
echo "✅ MySQL setup completed!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update .env.local with database credentials:"
echo "   MYSQL_HOST=localhost"
echo "   MYSQL_USER=$DB_USER"
echo "   MYSQL_PASSWORD=$DB_PASS"
echo "   MYSQL_DATABASE=couple_app"
echo ""
echo "2. Run database initialization:"
echo "   node scripts/init-db.js"
echo ""
