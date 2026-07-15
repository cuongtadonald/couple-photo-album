@echo off
REM Update VPS from Windows - Git Method
REM Usage: Run this file when you have changes to push

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Update VPS from Windows
echo ============================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo Error: Git not installed
    echo Please install Git from: https://git-scm.com/
    pause
    exit /b 1
)

REM Ask for commit message
set /p message="Enter commit message (or press Enter for 'Update'): "
if "%message%"=="" set message=Update

echo.
echo Step 1: Adding all changes...
git add .
if errorlevel 1 (
    echo Error adding changes
    pause
    exit /b 1
)

echo Step 2: Committing changes...
git commit -m "%message%"
if errorlevel 1 (
    echo Error committing. Maybe no changes to commit?
    pause
    exit /b 1
)

echo Step 3: Pushing to repository...
git push origin main
if errorlevel 1 (
    echo Error pushing to repository
    pause
    exit /b 1
)

echo.
echo ============================================
echo   SUCCESS: Changes pushed to repository!
echo ============================================
echo.
echo Next steps:
echo 1. SSH to VPS: ssh appuser@your_vps_ip
echo 2. Go to project: cd /home/appuser/your-project
echo 3. Pull changes: git pull
echo 4. Rebuild: pnpm build
echo 5. Restart: pm2 restart all
echo.
echo Or run: update-vps.sh on VPS to automate steps 3-5
echo.
pause
