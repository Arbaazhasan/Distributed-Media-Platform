# 🚀 Distributed Media Processing Platform - Cloud Deployment Guide

This guide explains why you saw **"Signaling Offline"** and **"Network Error"** on your live Vercel link, and gives you a step-by-step walkthrough to get your backend deployed online for **free** so your live link works completely.

---

## 🔍 Root Cause: Why Did It Fail On The Live Link?

| Symptom | Root Cause |
| :--- | :--- |
| **"Signaling Offline"** | 1. Vercel only hosts the React static client. The backend microservices (`api-gateway`, `signaling-server`, `worker-node`, `redis`) were only running locally on your laptop.<br>2. On Vercel, the frontend defaulted to `http://localhost:4000`. Browsers block secure HTTPS websites (`https://...vercel.app`) from connecting to insecure HTTP/WS endpoints (`http://localhost:4000`) due to **Mixed Content Security Restrictions**. |
| **"Network Error" on Submit** | When clicking upload, Axios tried to POST to `http://localhost:3000/api/upload`. Because `localhost:3000` is blocked by Mixed Content (or unreachable on other devices), the browser aborted the request immediately, throwing Axios `Network Error`. |

---

## 🛠️ What We Upgraded in Your Codebase

1. **Dual-Mode API Gateway**: [api-gateway/src/index.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/api-gateway/src/index.js) now mounts **Socket.IO Signaling directly on the HTTP server**, alongside the REST API. This means in cloud environments, you only need **one single backend URL** for both REST endpoints and real-time WebSockets!
2. **Cloud Redis URL & TLS Support**: [api-gateway/src/config/redis.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/api-gateway/src/config/redis.js), [signaling-server/src/config/redis.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/signaling-server/src/config/redis.js), and [worker-node/src/config/redis.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/worker-node/src/config/redis.js) now support `REDIS_URL` with TLS (`rediss://...`), compatible with Upstash, Redis Cloud, and Render.
3. **CORS Flexibility**: All services now dynamically allow your Vercel domain with credentials support.
4. **Smart Frontend URLs**: [client/src/config/constants.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/client/src/config/constants.js) strips trailing slashes and automatically derives `SIGNALING_URL` and `SERVER_HOST` from `VITE_API_BASE_URL`.
5. **Unified Cloud Backend Runner**: Added [scripts/start-backend.js](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/scripts/start-backend.js) and `npm run start:backend` in [package.json](file:///run/media/arbaz/Arbaz%20Hasan/Code/React%20Projects/distributed-media-platform/package.json) to run API Gateway, Socket.IO, and Worker Node concurrently on a single cloud service (saving costs and keeping disk access shared for FFmpeg transcoding).

---

## 📋 Step-by-Step Guide to Deploy the Backend (Free)

### Step 1: Create a Free Cloud Redis Database (1 minute)
Because Redis is used by BullMQ queues and Socket.io Pub/Sub, your cloud backend needs an online Redis instance.

1. Go to [Upstash](https://console.upstash.com/) (Free tier, no credit card required).
2. Click **Create Database**.
3. Name: `media-platform-redis` (choose region closest to you).
4. In the database details, scroll to **Node.js** or **ioredis** and copy the connection string:
   ```text
   rediss://default:xxxxxxxx@xxxxxx.upstash.io:6379
   ```

---

### Step 2: Deploy Backend to Render (Free Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository: `Distributed-Media-Processing-System`.
3. Configure the service settings:
   - **Name**: `distributed-media-backend`
   - **Region**: Choose closest to your Upstash region
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty, default root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:backend`
   - **Start Command**: `npm run start:backend`
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://arbazDb:arbazDb@cluster0.nuehib8.mongodb.net/media_platform?retryWrites=true&w=majority&appName=Cluster0` |
| `DB_CONNECTION` | `mongodb+srv://arbazDb:arbazDb@cluster0.nuehib8.mongodb.net/media_platform?retryWrites=true&w=majority&appName=Cluster0` |
| `REDIS_URL` | *(Your Upstash Redis connection string from Step 1)* |
| `CLOUDINARY_CLOUD_NAME` | `ddixq9qyw` |
| `CLOUDINARY_API_KEY` | `457974513769685` |
| `CLOUDINARY_API_SECRET` | `vtXUFQ4XPDtF7xYlCASYgIolvtE` |

5. Click **Create Web Service**.
6. Wait for the deploy to complete. Once finished, copy your Render service URL:
   `https://distributed-media-backend.onrender.com`

---

### Step 3: Link Vercel to your Cloud Backend

1. Go to [Vercel Dashboard](https://vercel.com/) and click on your `distributed-media-platform` project.
2. Go to **Settings** -> **Environment Variables**.
3. Add the following variables:

| Variable Name | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://distributed-media-backend.onrender.com/api` |
| `VITE_SIGNALING_URL` | `https://distributed-media-backend.onrender.com` |
| `VITE_SERVER_HOST` | `https://distributed-media-backend.onrender.com` |

*(Replace `distributed-media-backend.onrender.com` with your actual Render URL)*

4. Go to the **Deployments** tab in Vercel.
5. Click the three dots `...` on the latest deployment -> **Redeploy** (ensure "Use existing Build Cache" is unchecked so the new environment variables take effect).

---

## ⚡ Option B: Quick Testing (Connect Vercel to Local Machine via HTTPS Tunnel)

If you want to test the live Vercel link *right now* with your backend running on your local machine:

1. In a terminal, install & run localtunnel or ngrok:
   ```bash
   npx localtunnel --port 3000
   ```
   This gives you an HTTPS URL: `https://xxxx.loca.lt`
2. In Vercel Environment Variables:
   - `VITE_API_BASE_URL`: `https://xxxx.loca.lt/api`
   - `VITE_SIGNALING_URL`: `https://xxxx.loca.lt`
   - `VITE_SERVER_HOST`: `https://xxxx.loca.lt`
3. Redeploy on Vercel. This tunnels requests from the live HTTPS website directly to your running local backend!
