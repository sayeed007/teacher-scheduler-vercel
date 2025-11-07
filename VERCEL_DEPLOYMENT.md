# 🚀 Vercel Deployment Guide

This guide will help you deploy the Teacher Scheduler app to Vercel with Vercel KV (Redis) for data storage.

---

## Prerequisites

- GitHub/GitLab/Bitbucket account
- [Vercel account](https://vercel.com) (free tier works perfectly)
- Git installed locally

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd teacher-scheduler
git init
git add .
git commit -m "Initial commit - Teacher Scheduler with Vercel KV"
```

### 1.2 Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/teacher-scheduler.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "**Add New**" → "**Project**"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 2.2 Add Environment Variables (Optional)

If you need any custom environment variables, add them now. For this app, none are required by default.

---

## Step 3: Set Up Vercel KV

### 3.1 Create KV Database

1. In your Vercel project dashboard, go to "**Storage**" tab
2. Click "**Create Database**"
3. Select "**KV**" (Redis)
4. Choose a name (e.g., `teacher-scheduler-kv`)
5. Select region closest to your users
6. Click "**Create**"

### 3.2 Connect to Project

1. The KV database will automatically add environment variables to your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`

2. **Redeploy** your project to pick up these new environment variables:
   - Go to "**Deployments**" tab
   - Click the three dots on the latest deployment
   - Click "**Redeploy**"

---

## Step 4: Seed the Database

### 4.1 Generate Mock Data (locally)

```bash
npm run generate-data
```

This creates `db.json` with mock teacher and course data.

### 4.2 Deploy with db.json

Make sure `db.json` is committed to your repository:

```bash
git add db.json
git commit -m "Add generated mock data"
git push
```

Vercel will automatically redeploy.

### 4.3 Seed the KV Store

After deployment, visit:

```
https://your-app-name.vercel.app/api/seed
```

Or use curl:

```bash
curl -X POST https://your-app-name.vercel.app/api/seed
```

This will populate your Vercel KV store with data from `db.json`.

**Response:**
```json
{
  "success": true,
  "message": "Data seeded successfully",
  "counts": {
    "teachers": 10,
    "courseGroups": 9,
    "courses": 31,
    "divisions": 2
  }
}
```

---

## Step 5: Verify Deployment

1. Visit your deployed app: `https://your-app-name.vercel.app`
2. Check that teachers and courses load correctly
3. Test creating/editing/deleting teachers

---

## 🔄 Managing Data

### Clear All Data

```bash
curl -X DELETE https://your-app-name.vercel.app/api/seed
```

### Re-seed Data

```bash
# Clear and re-seed in one command
curl -X POST "https://your-app-name.vercel.app/api/seed?clear=true"
```

### Generate New Mock Data

Locally:
```bash
npm run generate-data
git add db.json
git commit -m "Update mock data"
git push
```

Then re-seed via the API endpoint.

---

## 📊 Monitoring KV Usage

### Check Storage Usage

1. Go to Vercel Dashboard → **Storage**
2. Click on your KV database
3. View:
   - Storage used
   - Commands per day
   - Free tier limits: **256 MB storage**, **3000 commands/day**

### KV Free Tier Limits

The free tier is generous for prototypes:
- ✅ **256 MB storage** - More than enough for thousands of teachers
- ✅ **3000 commands/day** - ~2 commands per page load = **1500 users/day**

For production, consider upgrading if you exceed these limits.

---

## 🛠️ Development Workflow

### Local Development (Without KV)

You can still use json-server locally:

```bash
npm run dev:all
```

This runs:
- Next.js dev server on `localhost:3000`
- JSON Server on `localhost:3001`

**Note:** The frontend will try to use `/api/*` routes in production but can fallback to json-server in development if needed.

### Local Development (With KV)

To test with Vercel KV locally:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link to your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run dev server:
   ```bash
   npm run dev
   ```

Now your local app uses the production Vercel KV!

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch teachers"

**Solution:**
1. Check Vercel KV is connected
2. Verify environment variables are set
3. Re-seed the database

### Issue: Empty data after deployment

**Solution:**
Run the seed endpoint:
```bash
curl -X POST https://your-app-name.vercel.app/api/seed
```

### Issue: KV authentication errors

**Solution:**
1. Verify KV database is connected to your project
2. Check environment variables in Vercel dashboard
3. Redeploy to pick up new env vars

---

## 📈 Scaling Considerations

### Current Setup (Good for):
- ✅ Demos/Portfolios
- ✅ Prototypes
- ✅ Small teams (<100 users)
- ✅ Development/Testing

### Need More Scale?

**Option 1: Upgrade Vercel KV**
- Pro: $20/month for 2 GB storage + higher limits
- Best for: Growing apps, small businesses

**Option 2: Migrate to Vercel Postgres**
- Better for: Complex queries, relational data
- Similar pricing, more features

**Option 3: External Database**
- Use Supabase, PlanetScale, or MongoDB Atlas
- Best for: Multi-tenant apps, enterprise

---

## 🎉 You're Live!

Your Teacher Scheduler is now deployed on Vercel with Vercel KV!

**Share your app:**
```
https://your-app-name.vercel.app
```

**Next Steps:**
- 🎨 Customize the UI
- 📊 Add analytics (Vercel Analytics is built-in)
- 🔒 Add authentication if needed
- 📱 Test on mobile devices

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 💡 Tips

1. **Auto-deployments**: Every push to `main` branch auto-deploys
2. **Preview deployments**: PRs get their own preview URLs
3. **Rollbacks**: Easily rollback to previous deployments
4. **Custom domains**: Add your own domain in Vercel settings
5. **Analytics**: Enable Vercel Analytics for free insights

---

**Questions?** Open an issue on GitHub or check the Vercel community forums.

Happy deploying! 🚀
