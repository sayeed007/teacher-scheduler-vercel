# 🆘 Troubleshooting Vercel Deployment

## Error: "Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN"

### Cause
The Vercel KV database is not connected to your project.

### Solution

#### Step 1: Connect KV to Project
1. Go to Vercel Dashboard → **Storage** tab
2. Click on your KV database (`teacher-scheduler-kv`)
3. Click **"Connect Project"** button
4. Select your project (`teacher-scheduler-vercel`)
5. Click **"Connect"**

#### Step 2: Verify Environment Variables
1. Go to your project → **Settings** → **Environment Variables**
2. Verify these 4 variables exist:
   - ✅ `KV_REST_API_URL`
   - ✅ `KV_REST_API_TOKEN`
   - ✅ `KV_REST_API_READ_ONLY_TOKEN`
   - ✅ `KV_URL`

#### Step 3: Redeploy
**Option A: From Vercel Dashboard**
1. Go to **Deployments** tab
2. Click three dots (...) on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to finish

**Option B: Git Push**
```bash
git commit --allow-empty -m "Redeploy with KV env vars"
git push
```

#### Step 4: Test
Visit: `https://your-app.vercel.app/api/seed`

You should see:
```json
{
  "success": true,
  "message": "Data seeded successfully",
  "counts": { ... }
}
```

---

## Error: HTTP 405 Method Not Allowed

### Cause
Visiting `/api/seed` in browser sends GET request, but endpoint only accepts POST.

### Solution
Already fixed! Just redeploy:
```bash
git pull
git push
```

---

## Error: "db.json not found"

### Cause
The `db.json` file is not in your repository or is in `.gitignore`.

### Solution

#### Check if db.json exists
```bash
ls db.json
```

#### If missing, generate it:
```bash
npm run generate-data
```

#### Make sure it's committed:
```bash
git add db.json
git commit -m "Add generated mock data"
git push
```

---

## App Shows "Failed to fetch teachers"

### Possible Causes & Solutions

#### 1. KV Not Seeded
**Solution**: Visit `/api/seed` endpoint

#### 2. KV Not Connected
**Solution**: Follow "Missing environment variables" steps above

#### 3. Build Failed
**Check**: Vercel Dashboard → Deployments → Check for errors

**Solution**:
```bash
# Test build locally
npm run build

# Fix any TypeScript errors
# Then push
git push
```

---

## Data Not Updating

### Clear and Re-seed
```bash
# Clear all data
curl -X DELETE https://your-app.vercel.app/api/seed

# Re-seed
curl -X POST https://your-app.vercel.app/api/seed?clear=true
```

Or visit in browser:
```
https://your-app.vercel.app/api/seed?clear=true
```

---

## Local Development Issues

### "Cannot find module '@vercel/kv'"

**Solution**:
```bash
npm install
```

### Want to use json-server instead?

**Option 1**: Set environment variable
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Option 2**: Use the dev:all script
```bash
npm run dev:all
```

### Want to use Vercel KV locally?

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run dev
npm run dev
```

---

## Vercel KV Usage Limits

### Free Tier Limits
- **Storage**: 256 MB
- **Commands**: 3,000 per day
- **Bandwidth**: Generous

### Check Usage
1. Vercel Dashboard → **Storage**
2. Click your KV database
3. View **Usage** tab

### If You Exceed Limits
- Upgrade to Pro ($20/month)
- Or optimize queries
- Or use external database (MongoDB, Supabase, etc.)

---

## Environment Variables Not Working

### For Production
1. Settings → Environment Variables
2. Add/Edit variables
3. **Must redeploy** after changing

### For Local Development
Create `.env.local`:
```env
KV_REST_API_URL=your_url
KV_REST_API_TOKEN=your_token
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
```

---

## Build Errors

### Type Errors
```bash
# Check locally
npx tsc --noEmit

# Common fixes:
# - Check imports match file structure
# - Verify all types are exported
# - Check tsconfig.json paths
```

### Module Not Found
```bash
# Install dependencies
npm install

# Check paths in tsconfig.json
{
  "paths": {
    "@/*": ["./*"]  // Should match your structure
  }
}
```

---

## Still Having Issues?

### Check Vercel Logs
1. Go to deployment
2. Click **"View Function Logs"**
3. Look for errors

### Check Browser Console
1. Open DevTools (F12)
2. Check Console tab
3. Check Network tab

### Test Individual Endpoints
```bash
# Test teachers
curl https://your-app.vercel.app/api/teachers

# Test catalog
curl https://your-app.vercel.app/api/catalog

# Test divisions
curl https://your-app.vercel.app/api/divisions
```

### Verify KV Connection
```bash
# Should return stored data or empty array
curl https://your-app.vercel.app/api/teachers
```

If empty, seed it:
```bash
curl -X POST https://your-app.vercel.app/api/seed
```

---

## Contact & Resources

- 📚 [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- 📚 [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- 💬 [Vercel Community](https://github.com/vercel/vercel/discussions)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

---

**Most Common Fix**: Connect KV → Redeploy → Seed Data 🚀
