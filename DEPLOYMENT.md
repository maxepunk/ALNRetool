# ALNRetool Deployment Guide

## Deployment to Render.com

### Prerequisites
1. GitHub repository with the latest code
2. Notion API key and database IDs
3. Render.com account (free tier works)

### Critical Environment Variable Configuration

**⚠️ IMPORTANT**: The application follows 12-factor app principles. In production:
- Environment variables MUST be set through the platform (Render dashboard)
- The application will NOT load .env files in production (NODE_ENV=production)
- Missing required variables will cause the server to fail fast and exit

This prevents accidental override of production secrets by development .env files.

### Step 1: Connect Repository
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select the `maxepunk/ALNRetool` repository
5. Click "Connect"

### Step 2: Configure Service
Use these settings in the Render dashboard:

- **Name**: `alnretool` (or your preferred name)
- **Region**: Oregon (US West) or closest to you
- **Branch**: `main` or `feature/sprint-1-foundation`
- **Root Directory**: Leave empty (uses repository root)
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Instance Type**: Free

### Step 3: Environment Variables
Add these environment variables in Render dashboard:

```
NODE_ENV=production
NOTION_API_KEY=your_notion_api_key_here
FRONTEND_URL=https://alnretool.onrender.com

# Database IDs (from Notion) - CRITICAL: Use exact field names
NOTION_CHARACTERS_DB=18c2f33d-583f-8060-a6ab-de32ff06bca2
NOTION_ELEMENTS_DB=18c2f33d-583f-8020-91bc-d84c7dd94306
NOTION_PUZZLES_DB=1b62f33d-583f-80cc-87cf-d7d6c4b0b265
NOTION_TIMELINE_DB=1b52f33d-583f-80de-ae5a-d20020c120dd
```

**⚠️ CRITICAL**: The database ID environment variables must match exactly what the code expects:
- Use `NOTION_CHARACTERS_DB` not `NOTION_CHARACTER_DB_ID`
- Use `NOTION_ELEMENTS_DB` not `NOTION_ELEMENT_DB_ID`
- Use `NOTION_PUZZLES_DB` not `NOTION_PUZZLE_DB_ID`
- Use `NOTION_TIMELINE_DB` not `NOTION_TIMELINE_DB_ID`

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for the initial build and deploy (5-10 minutes)
3. Your app will be available at `https://alnretool.onrender.com`

### Step 5: Verify Deployment
1. Visit `https://alnretool.onrender.com/healthz` - Should show "OK"
2. Visit `https://alnretool.onrender.com/api/health` - Should show JSON status
3. Visit `https://alnretool.onrender.com` - Should load the React app

## Monitoring and Logs

### View Logs
- In Render dashboard, click on your service
- Navigate to "Logs" tab
- Monitor for any errors during startup or runtime

### Common Issues and Solutions

#### 1. Build Fails
- Check Node version compatibility (requires Node 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

#### 2. App Crashes on Start
- Verify all environment variables are set correctly (see Critical Environment Variables section)
- Check if PORT is being overridden (Render sets this automatically)
- Look for TypeScript compilation errors in logs

#### 3. API Returns 500 Errors
**Root Cause**: dotenv loading .env files in production and overriding platform variables

**Solution**: The application now prevents dotenv from loading in production mode. Ensure:
- `NODE_ENV=production` is set in Render environment variables
- Never commit .env files to the repository (they should be in .gitignore)
- All required environment variables are set in Render dashboard

**Verification**: Check server logs for:
- ✅ Good: `[Server] Production mode - Using platform environment variables (dotenv not loaded)`
- ❌ Bad: `[dotenv@17.2.0] injecting env (11) from .env`

#### 4. Missing Environment Variables
The server now validates required variables at startup and will fail fast in production if any are missing:
- `NOTION_API_KEY`
- `NOTION_CHARACTERS_DB`
- `NOTION_ELEMENTS_DB`
- `NOTION_PUZZLES_DB`
- `NOTION_TIMELINE_DB`

#### 5. CORS Issues
- Update FRONTEND_URL to match your Render URL
- For custom domains, update FRONTEND_URL accordingly
- In production, same-origin requests are allowed without API key

## Automatic Deployments

Render automatically deploys when you push to the connected branch:

1. Make changes locally
2. Commit and push to GitHub
3. Render detects the push and starts a new deployment
4. Monitor deployment progress in Render dashboard

## Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and follow DNS configuration instructions

## Performance Considerations

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Limited to 750 hours/month across all services

### Optimization Tips
1. **Keep Warm**: Set up external monitoring to ping `/healthz` every 10 minutes
2. **Cache Strategy**: Our 5-minute cache reduces Notion API calls
3. **Bundle Size**: Monitor bundle size to ensure fast initial loads

## Rollback Procedure

If deployment issues occur:

1. In Render dashboard, go to your service
2. Click "Events" tab
3. Find the last successful deploy
4. Click "Rollback to this deploy"

## Security Checklist

- [x] API keys stored as environment variables
- [x] CORS configured for production domain
- [x] Rate limiting enabled (100 requests/minute)
- [x] Authentication middleware on all Notion endpoints
- [x] No sensitive data in client bundle
- [x] HTTPS enforced by Render

## Support and Monitoring

### Health Endpoints
- `/healthz` - Simple health check for uptime monitoring
- `/api/health` - Detailed API health with timestamp
- `/api/cache/stats` - Cache performance metrics (requires API key)

### Recommended Monitoring
1. **UptimeRobot** or **Pingdom** - Free tier available
2. Set up monitoring for `/healthz` endpoint
3. Alert on response time > 5 seconds or status != 200

## Troubleshooting Production Issues

### Debugging Steps
1. **Check Server Logs First**
   - Navigate to Render dashboard → Your Service → Logs
   - Look for startup messages confirming environment configuration
   - Check for any error messages or stack traces

2. **Verify Environment Variables**
   - In Render dashboard → Settings → Environment
   - Confirm all 5 required variables are set
   - Use exact variable names (e.g., `NOTION_CHARACTERS_DB` not `NOTION_CHARACTER_DB`)

3. **Test API Endpoints**
   ```bash
   # Health check (should always work)
   curl https://your-app.onrender.com/api/health
   
   # Test Notion endpoints (from same origin)
   curl https://your-app.onrender.com/api/notion/characters?limit=1
   ```

4. **Check Browser Console**
   - Open Developer Tools → Console
   - Look for CORS errors or 500 responses
   - Check Network tab for failed requests

### Known Issues and Fixes
- **Issue**: All API endpoints return 500 errors
  - **Fix**: Ensure NODE_ENV=production and all NOTION_* variables are set in Render
  
- **Issue**: "Missing required environment variables" in logs
  - **Fix**: Add missing variables in Render dashboard, redeploy

- **Issue**: "[dotenv@...] injecting env" appears in production logs
  - **Fix**: Update to latest code that prevents dotenv loading in production

## Deployment Verification Checklist

After deployment, verify:

- [ ] Server logs show: "Production mode - Using platform environment variables"
- [ ] Server logs show: "All required environment variables are configured ✓"
- [ ] Homepage loads without errors
- [ ] API health check returns OK
- [ ] Can fetch character data
- [ ] Can fetch element data  
- [ ] Can fetch puzzle data
- [ ] Can fetch timeline data
- [ ] React Flow renders properly
- [ ] No console errors in browser
- [ ] Network requests use correct API endpoints