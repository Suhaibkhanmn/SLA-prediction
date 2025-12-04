# Deployment Guide

Step-by-step guide to deploy the SLA Prediction app to Render (backend) and Netlify (frontend).

## What You Need

1. GitHub account - https://github.com
2. Render account - https://render.com
3. Netlify account - https://netlify.com

## What is Docker

Docker packages your app with all dependencies so it runs the same everywhere. Render builds the Docker container for you, so you don't need to install Docker locally.

## Step 1: Prepare Your Code

Make sure `.env` files are in `.gitignore`:

```
.env
frontend/.env
*.db
.venv
node_modules
```

Commit your files:

```powershell
git status
git add .
git commit -m "Ready for deployment"
```

## Step 2: Push to GitHub

Create a new repository on GitHub:

1. Go to https://github.com
2. Click New repository
3. Name it `sla-predict`
4. Make it Public (required for Render free tier)
5. Click Create repository

Push your code:

```powershell
git init
git remote add origin https://github.com/YOUR_USERNAME/sla-predict.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy Backend to Render

Create Render account:

1. Go to https://render.com
2. Click Get Started for Free
3. Sign up with GitHub

Create web service:

1. Click New + → Web Service
2. Connect your GitHub account if needed
3. Select your `sla-predict` repository

Configure service:

| Field | Value |
|-------|-------|
| Name | `sla-backend` |
| Region | Choose closest to you |
| Branch | `main` |
| Root Directory | Leave empty |
| Runtime | `Docker` |
| Dockerfile Path | `Dockerfile` |
| Plan | `Free` |

Click Create Web Service.

Add environment variables:

Go to Environment tab and add:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Long random string |
| `SIGNUP_KEY` | Your secret signup code |
| `EMAIL_FROM` | Your Gmail address |
| `EMAIL_TO` | Alert recipient email |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password |

To get Gmail App Password:
1. Google Account → Security
2. Enable 2-Step Verification
3. App passwords → Generate for Mail
4. Copy 16-character password

Add persistent disk:

1. Go to Disks tab
2. Click Add Disk
3. Name: `db-data`
4. Mount Path: `/app`
5. Size: `1 GB`
6. Click Save

Wait for deploy. First deploy takes 5-10 minutes. When it shows Live, copy your backend URL (e.g., `https://sla-backend-xxxx.onrender.com`).

Test backend:

Open `https://your-backend-url.onrender.com/health` in browser. Should return:

```json
{"api":"ok","db":"ok","settings":"ok"}
```

## Step 4: Deploy Frontend to Netlify

Create Netlify account:

1. Go to https://netlify.com
2. Click Sign up
3. Sign up with GitHub

Create new site:

1. Click Add new site → Import an existing project
2. Click Deploy with GitHub
3. Authorize Netlify
4. Select your `sla-predict` repository

Configure build:

| Field | Value |
|-------|-------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |

Click Deploy site.

Add environment variables:

1. Go to Site settings → Environment variables
2. Click Add variable
3. Add `VITE_API_URL` = your Render backend URL
4. Optionally add `VITE_GEMINI_API_KEY`
5. Click Save

Trigger redeploy:

1. Go to Deploys tab
2. Click Trigger deploy → Clear cache and deploy site

Copy your frontend URL (e.g., `https://sla-predict-xxxx.netlify.app`).

## Step 5: Test Everything

Test frontend:

1. Open your Netlify URL
2. You should see the landing page
3. Click Sign In

Create first user:

Since signup is protected, create a user via API. Go to `https://your-backend-url.onrender.com/docs`, find `/auth/register`, click Try it out, and send:

```json
{
  "email": "admin@example.com",
  "password": "Admin123!",
  "role": "admin",
  "signup_key": "your-signup-key-here"
}
```

Should return `{"ok": true}`.

Login:

1. Go to your Netlify frontend URL
2. Click Sign In
3. Use the email and password you just created
4. Should log in and show dashboard

## Troubleshooting

Backend won't start:
- Check Render logs tab
- Verify all environment variables are set
- Verify disk is mounted at `/app`

Frontend can't connect to backend:
- Verify `VITE_API_URL` in Netlify matches Render URL exactly
- Check browser console (F12) for errors
- Verify backend shows Live on Render

Database not persisting:
- Verify disk is mounted at `/app`
- Check disk size is 1 GB
- Restart service after adding disk

Email not sending:
- Verify Gmail App Password is correct
- Check SMTP settings in Render environment variables
- Check Render logs for email errors

## You're Live

Your app is deployed:
- Backend: `https://your-backend.onrender.com`
- Frontend: `https://your-app.netlify.app`

## Next Steps

1. Custom Domain: Add your domain in Netlify/Render settings
2. SSL: Both platforms provide free SSL automatically
3. Monitoring: Set up alerts in Render for downtime
4. Backups: Back up `sla_logs.db` periodically

## Need Help

If something breaks:
1. Check Render logs
2. Check Netlify build logs
3. Check browser console (F12)
4. Share error message and which step failed
