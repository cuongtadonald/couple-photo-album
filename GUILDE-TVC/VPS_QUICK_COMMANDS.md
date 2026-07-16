# VPS Update Commands - Version 6

## Quick Deployment (Copy & Paste)

### On VPS (SSH Access)

```bash
cd /home/appuser/couple-photo-album

# Stop app
pm2 stop tinhy-au

# Pull latest code
git pull origin main

# Install dependencies (with fixed pnpm config)
pnpm install

# Build
pnpm build

# Restart app
pm2 restart tinhy-au

# Check status
pm2 status
pm2 logs tinhy-au --lines 20
```

### Full Command (One Line)

```bash
ssh appuser@65.75.200.34 "cd /home/appuser/couple-photo-album && pm2 stop tinhy-au && git pull && pnpm install && pnpm build && pm2 restart tinhy-au && pm2 status"
```

## Test After Deployment

```bash
# From VPS
curl http://localhost:3000/login | grep "Cuong"

# From your computer
curl http://65.75.200.34:3001/login | grep "Cuong"
```

## If pnpm install Still Shows Warnings

The current fix moved `pnpm.overrides` to the root level of package.json. This is the correct format for pnpm v10+.

The warning about "hono" is safe to ignore - it just means that dependency is being locked to that version.

## Fixed Files

- `package.json` - Moved `pnpm.overrides` to correct location

## Version 6 Status

✓ All code changes pushed
✓ Build successful
✓ pnpm config fixed
✓ Ready to deploy to VPS
