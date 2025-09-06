# Backend Setup Instructions

## The Problem
Your app is getting "Server returned HTML instead of JSON" errors because the backend server is not running.

## Quick Fix

### Step 1: Start the Backend Server
Open a **new terminal window** and run:
```bash
bun run server.ts
```

You should see:
```
🚀 Starting HomeSlam backend server on port 8081
✅ HomeSlam backend server is running on http://localhost:8081
📡 tRPC endpoint available at http://localhost:8081/api/trpc
🏥 Health check available at http://localhost:8081/api
```

### Step 2: Keep Both Servers Running
You need **TWO terminal windows**:
1. **Terminal 1**: Backend server (`bun run server.ts`)
2. **Terminal 2**: Frontend app (`bun start` or your existing start command)

### Step 3: Test the Fix
1. Go to the Debug screen in your app (tap the settings icon)
2. Tap "Test Backend Connection"
3. You should see "✅ Backend Working!"

## Alternative: Use Sample Data
If you don't want to run the backend server:
1. Go to Debug screen
2. Tap "Create Sample Data"
3. This will create 3 sample projects that work offline

## Your Data Recovery
Your data is likely still there! In the Debug screen:
1. Tap "Auto-Recover Data" to find any lost projects
2. Or tap "Export/Backup Data" to save your current projects
3. The app works offline, so your data should be in local storage

## Why This Happened
The app has both:
- **Frontend**: React Native app (runs on Expo/Rork)
- **Backend**: Node.js server with database (needs to run separately)

When the backend isn't running, the app tries to connect and gets HTML error pages instead of JSON data.

## Prevention
Always start both servers:
1. `bun run server.ts` (backend)
2. `bun start` (frontend)

Or add this to your package.json scripts and use a tool like `concurrently` to run both at once.