# Backend Setup and Troubleshooting Guide

## 🚑 URGENT FIX FOR "HTML INSTEAD OF JSON" ERROR

### The Problem
Your app is getting "Server returned HTML instead of JSON (200)" errors because:
1. The backend server is not running, OR
2. The mobile app can't find the backend server

### 🚀 IMMEDIATE SOLUTION

#### Step 1: Start the Backend Server
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

#### Step 2: Test Backend in Browser
Open your browser and go to: `http://localhost:8081/api`

You should see JSON like:
```json
{
  "status": "ok",
  "message": "HomeSlam API is running",
  "endpoints": {
    "health": "/api",
    "trpc": "/api/trpc"
  }
}
```

#### Step 3: Use the Debug Screen in Your App
1. In your mobile app, go to **Settings** tab
2. Look for "Backend Test" or "Debug" option
3. Tap **"🚀 Run All Tests"**
4. This will show you exactly what's wrong

#### Step 4: Keep Both Servers Running
You need **TWO terminal windows**:
1. **Terminal 1**: Backend server (`bun run server.ts`) - **KEEP THIS RUNNING**
2. **Terminal 2**: Frontend app (`bun start` or your existing start command)

### 📱 Mobile Connection Issues

If backend works in browser but not in mobile app:

#### For Expo Go on Phone:
1. Make sure your phone and computer are on the **same WiFi network**
2. Check the console logs for "tRPC client configuration" to see what URL it's using
3. The app will try to auto-detect your computer's IP address

#### Manual IP Fix (if auto-detection fails):
1. Find your computer's IP address:
   - **Mac/Linux**: `ifconfig | grep inet`
   - **Windows**: `ipconfig`
2. Look for something like `192.168.1.100` or `10.0.0.100`
3. Set environment variable: `EXPO_PUBLIC_API_URL=http://YOUR_IP:8081`

### 🔍 Debugging Steps

1. **Check if backend is running**: Go to `http://localhost:8081/api` in browser
2. **Use Backend Test screen**: Run all tests to see connection status
3. **Check console logs**: Look for tRPC configuration and error messages
4. **Try different IPs**: Use the Backend Test screen to test different URLs

### 💾 Your Data Recovery

Your projects are likely still there! The app works offline:
1. Go to Debug screen in your app
2. Look for "Auto-Recover Data" or similar option
3. Your data is stored locally and should reappear when backend connects

### 🚫 Common Mistakes

- **Only running frontend**: You need BOTH frontend AND backend servers
- **Wrong network**: Phone and computer must be on same WiFi
- **Firewall blocking**: Check if firewall is blocking port 8081
- **Port already in use**: Another app might be using port 8081

### 🔧 Advanced Troubleshooting

```bash
# Check if port 8081 is in use
lsof -i :8081  # Mac/Linux
netstat -ano | findstr :8081  # Windows

# Kill process using port 8081 (if needed)
kill -9 $(lsof -ti:8081)  # Mac/Linux

# Find your IP address
ifconfig | grep "inet "  # Mac/Linux
ipconfig  # Windows
```

### 🎆 Success Indicators

You'll know it's working when:
1. Backend terminal shows server running on port 8081
2. Browser shows JSON at `http://localhost:8081/api`
3. Mobile app Backend Test shows all tests passing
4. Your projects appear in the app
5. No more "HTML instead of JSON" errors

### 📞 Need Help?

If you're still getting errors:
1. Run the Backend Test screen and share the results
2. Check both terminal windows for error messages
3. Verify your computer's IP address and network connection

---

## Architecture Overview

```
Mobile App (Expo) ←→ tRPC Client ←→ Backend Server (Hono) ←→ tRPC Router
     ↓                    ↓                    ↓              ↓
  React Query      HTTP Requests        Port 8081      Database/Logic
```

The mobile app uses tRPC to make HTTP requests to the backend server. When the backend isn't running or unreachable, you get HTML error pages instead of JSON responses.