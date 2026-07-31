#!/bin/bash

# Deploy Script for Ubuntu VPS
# Usage: bash deploy.sh

set -e  # Exit on error

echo "======================================"
echo "🚀 Tình Yêu Của Chúng Ta - VPS Deploy"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if running as appuser (not root)
if [[ $EUID -eq 0 ]]; then
   print_error "Script không nên chạy bằng root. Chạy bằng appuser"
   exit 1
fi

print_info "Starting deployment process..."

# Step 1: Check Node.js
print_info "Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js first"
    exit 1
fi
NODE_VERSION=$(node --version)
print_status "Node.js $NODE_VERSION found"

# Step 2: Check pnpm
print_info "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm not found. Installing..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm --version)
print_status "pnpm $PNPM_VERSION found"

# Step 3: Check MySQL
print_info "Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    print_error "MySQL not found. Please install MySQL first"
    exit 1
fi
print_status "MySQL found"

# Step 4: Navigate to project
PROJECT_DIR="/home/appuser/app-project"
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found at $PROJECT_DIR"
    exit 1
fi
cd "$PROJECT_DIR"
print_status "Project directory: $PROJECT_DIR"

# Step 5: Check .env.local
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found"
    print_info "Creating .env.local template..."
    cat > .env.local << EOF
MYSQL_HOST=localhost
MYSQL_USER=couple_user
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=couple_app
JWT_SECRET=change_me_to_long_random_string
NODE_ENV=production
PORT=3000
EOF
    print_info "Created .env.local. Please edit it with your credentials"
    exit 1
fi
print_status ".env.local found"

# Step 6: Install dependencies
print_info "Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
print_status "Dependencies installed"

# Step 7: Initialize database
print_info "Checking if database is initialized..."
TABLES=$(mysql -u couple_user -p"${MYSQL_PASSWORD}" couple_app -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLES" -le 1 ]; then
    print_info "Database empty. Initializing..."
    node scripts/init-db.js
    print_status "Database initialized"
else
    print_status "Database already initialized"
fi

# Step 8: Build project
print_info "Building project for production..."
pnpm build
print_status "Build completed"

# Step 9: Check PM2
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 not found. Installing..."
    sudo npm install -g pm2
fi
print_status "PM2 found"

# Step 10: Check ecosystem.config.js
if [ ! -f "ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found"
    exit 1
fi
print_status "ecosystem.config.js found"

# Step 11: Start/Restart application
print_info "Starting application with PM2..."
pm2 delete tinhy-au 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
print_status "Application started with PM2"

# Step 12: Verify application is running
sleep 2
if pm2 list | grep -q "tinhy-au.*online"; then
    print_status "Application is running successfully"
else
    print_error "Application failed to start. Check logs: pm2 logs tinhy-au"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Check application logs: pm2 logs tinhy-au"
echo "2. Access application: http://your_domain_or_ip"
echo "3. Login with passcode: 281120 (Anh) or 090803 (Em)"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs tinhy-au   - View logs"
echo "  pm2 stop tinhy-au   - Stop app"
echo "  pm2 restart tinhy-au - Restart app"
echo ""
