#!/bin/bash

# Update VPS from Git Pull
# Run this on VPS after pushing changes from Windows

set -e  # Exit on error

PROJECT_PATH="/home/appuser/your-project"
APP_NAME="tinhy-au"

echo ""
echo "============================================"
echo "  Updating VPS from Git Repository"
echo "============================================"
echo ""

# Check if directory exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project directory not found at $PROJECT_PATH"
    echo "Please update PROJECT_PATH in this script"
    exit 1
fi

cd "$PROJECT_PATH"

# Step 1: Pull latest changes
echo "Step 1: Pulling latest changes..."
if ! git pull origin main; then
    echo "Error: Failed to pull changes"
    exit 1
fi

# Step 2: Install dependencies (only if package.json changed)
echo ""
echo "Step 2: Installing dependencies..."
if ! pnpm install; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

# Step 3: Build
echo ""
echo "Step 3: Building application..."
if ! pnpm build; then
    echo "Error: Build failed"
    exit 1
fi

# Step 4: Restart with PM2
echo ""
echo "Step 4: Restarting application..."
if ! pm2 restart "$APP_NAME"; then
    echo "Error: Failed to restart with PM2"
    echo "Trying manual start..."
    pm2 start ecosystem.config.js
fi

# Step 5: Show status
echo ""
echo "============================================"
echo "  UPDATE COMPLETE!"
echo "============================================"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Recent logs:"
pm2 logs "$APP_NAME" --lines 10
echo ""
echo "✅ Update finished successfully!"
echo "🌐 Check: http://your_vps_ip:3000"
echo ""
