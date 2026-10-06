# VYRA — Cloud Deployment Guide (Vercel + Render)

This guide walks you through deploying the complete **VYRA** research system into production:
- **Frontend (Presentation & Prototype UI):** Deployed on **[Vercel](https://vercel.com)** (Edge Global CDN)
- **Backend (FastAPI, Telemetry Engine & WebSockets):** Deployed on **[Render](https://render.com)** (Managed Web Service)

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Client Web Browser        |
                      |   (Desktop / Mobile)        |
                      +--------------+--------------+
                                     |
              HTTPS (Static Assets)  |  HTTPS / WSS (API & 10 Hz Telemetry)
                                     |
            +------------------------v------------------------+
            |                                                 |
            v                                                 v
  +--------------------+                           +---------------------+
  |      VERCEL        |                           |       RENDER        |
  |  Frontend CDN      |                           |   Python Backend    |
  |                    |                           |                     |
  | • React 18 / Vite  |                           | • FastAPI / Uvicorn |
  | • Three.js 3D Hero |                           | • 10 Hz WebSockets  |
  | • Leaflet Maps     |                           | • Parquet Replay    |
  | • Plotly Charts    |                           | • Results Service   |
  +--------------------+                           +---------------------+
```

---

## Prerequisites

1. Your VYRA repository pushed to **GitHub** (public or private).
2. A free account on **[Render](https://render.com)**.
3. A free account on **[Vercel](https://vercel.com)**.

> [!IMPORTANT]
> Always deploy the **Backend on Render first**. This gives you your live backend URL (e.g., `https://vyra-backend.onrender.com`), which you will then provide to Vercel during the frontend deployment.

---

## Part 1: Deploy Backend on Render

Render will host the FastAPI application, serving the REST endpoints, 16 publication figures, 8 benchmark evidence tables, and the 10 Hz WebSocket telemetry stream.

### Option A: 1-Click Blueprint (Recommended)

1. Log into **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](file:///e:/VYRA-major/render.yaml) located in the repository root.
5. Click **Apply**. Render will provision the Web Service, install dependencies, and start the FastAPI server.

---

### Option B: Manual Web Service Setup

If you prefer setting it up manually without Blueprints:

1. In the **Render Dashboard**, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name:** `vyra-backend` (or your preferred name)
   - **Region:** Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `main` (or your active default branch)
   - **Root Directory:** *(leave blank — repository root)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free` (or `Starter` for zero sleep/spin-down)
4. Under **Environment Variables**, add:
   | Key | Value | Note |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.11.9` | Ensures compatibility with all scientific packages |
5. Click **Create Web Service**.

### Verify Render Deployment

Once Render finishes deploying (Status: **Live**):
1. Copy your Render URL: `https://<YOUR-RENDER-NAME>.onrender.com`.
2. Open `https://<YOUR-RENDER-NAME>.onrender.com/api/health` in your browser. You should receive:
   ```json
   {
     "status": "healthy",
     "service": "vyra-navigation-backend",
     "dataset_split": "V-S3a",
     "total_epochs": 24621
   }
   ```
3. Open `https://<YOUR-RENDER-NAME>.onrender.com/docs` to verify the interactive Swagger documentation.

---

## Part 2: Deploy Frontend on Vercel

Vercel will compile and host the Vite React application with global edge acceleration.

1. Log into **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `frontend` (or leave as root if using the included root [`vercel.json`](file:///e:/VYRA-major/vercel.json)).
   - **Build and Output Settings:**
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://<YOUR-RENDER-NAME>.onrender.com` | Your live Render backend URL without trailing slash |
   | `VITE_WS_URL` | `wss://<YOUR-RENDER-NAME>.onrender.com` | Secure WebSocket URL (optional; derived automatically if omitted) |
6. Click **Deploy**.

Vercel will build the frontend and assign a production URL (e.g., `https://vyra-navigation.vercel.app`).

---

## Part 3: Live Verification & Testing

1. Open your Vercel deployment URL.
2. **3D Landing Page:**
   - Verify the 3D interactive hero renders smoothly.
   - Click **INSPECT EVIDENCE TABLES** to verify that Table 1–8 and publication figures load directly from the Render API.
3. **Interactive Prototype Dashboard:**
   - Click **LAUNCH LIVE PROTOTYPE** (or navigate to `/#prototype`).
   - Check the top right connection pill:
     - **`10 Hz LIVE`** (in emerald green) indicates the WebSocket stream is successfully connected.
     - If it shows **`RECONNECTING`**, wait ~30 seconds for the Render free-tier instance to wake up.
   - Click **Play**, **Step Forward**, and scrub the timeline to test real-time telemetry streaming and map synchronisation.

---

## Troubleshooting & FAQ

### 1. Render Free Tier Cold Starts
- **Symptom:** On the free tier, Render suspends inactive containers after 15 minutes. The frontend may display `RECONNECTING` when first opened.
- **Fix:** Wait 30–50 seconds for Render to wake up. The frontend has built-in automatic reconnect logic that resumes streaming as soon as the backend responds.

### 2. WebSocket Connection Dropping
- **Symptom:** `WebSocket connection to 'wss://...' failed`.
- **Cause:** Ensure you are using `wss://` (secure WebSocket) in production, not `ws://`. Browsers block unencrypted `ws://` connections from HTTPS sites due to Mixed Content policies.
- **Fix:** If specifying `VITE_WS_URL`, ensure it starts with `wss://`.

### 3. Missing Publication Figures or Tables
- **Cause:** Precomputed research artifacts (`results/processed/v_s3a_playback_cache.parquet` or `results/tables/`) were ignored by git.
- **Fix:** In `.gitignore`, ensure the production files are explicitly unignored (`!results/processed/v_s3a_playback_cache.parquet`). This has already been pre-configured in this repository.

### 4. Custom Domains
- **Vercel:** In Project Settings -> Domains, add your custom domain (e.g. `vyra.ai` or `nav.yourdomain.com`).
- **Render:** In Settings -> Custom Domains, add your backend subdomain (e.g. `api.vyra.ai`). Then update `VITE_API_URL` on Vercel to match.
