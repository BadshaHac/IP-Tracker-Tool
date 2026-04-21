# 🌐 IP Tracker Tool

A professional web-based **IP Intelligence Tool** that fetches detailed information about any public IP address using multiple API providers with a fallback mechanism for high reliability.

---

## 🚀 Features

* 🔍 Lookup any IPv4 / IPv6 address
* 📍 Get Location (Country, Region, City)
* 📡 ISP & Organization details
* 🧠 ASN (Autonomous System Number)
* ⏰ Timezone detection
* 💰 Currency & Continent
* 🗺️ Google Maps link
* 🔄 Multi-API fallback system (Reliable results)
* ⚡ Works in both:

  * Browser-only mode
  * Node.js server mode (recommended)

---

## 🧠 How It Works

1. User enters an IP address in the UI
2. Frontend sends request to backend (`server.js`)
3. Backend calls external APIs:

   * ipwho.is (Primary)
   * ipapi.co (Fallback)
   * country.is (Backup fallback)
4. If one API fails → automatically switches to another
5. Data is cleaned and structured
6. Results displayed in UI

👉 Backend acts as a **proxy server** to avoid CORS issues and improve reliability.

---

## 🛠️ Tech Stack

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js
* APIs Used:

  * ipwho.is
  * ipapi.co
  * country.is

---

## ⚙️ Installation Guide

### Step 1: Install Node.js

Download and install Node.js (LTS version):
https://nodejs.org/

Verify installation:

```bash
node -v
npm -v
```

---

### Step 2: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ip-tracker-tool.git
cd ip-tracker-tool
```

---

### Step 3: Install Dependencies

```bash
npm install
```

---

### Step 4: Run the Application

```bash
npm start
```

---

### Step 5: Open in Browser

```bash
http://localhost:8080/
```

---

## 🧪 Usage

### 🔹 Manual IP Lookup

* Enter any IP address (e.g., `8.8.8.8`)
* Click **Search**
* View detailed results

### 🔹 Auto Detect Your IP

* Click **Use My IP**
* Tool automatically fetches your IP details

---

## ⚠️ Common Issues & Fixes

### ❌ "Failed to fetch"

* Cause: Opening project using `file://`
* Fix: Always run using:

```bash
npm start
```

---

### ❌ npm not recognized

* Install Node.js properly
* Restart PowerShell
* OR use:

```bash
npm.cmd start
```

---

### ❌ Some fields show "Unavailable"

* Reason: API does not provide that data
* This is expected behavior

---

## 🌐 Deployment

* GitHub → Code hosting ✅
* Vercel → Requires serverless backend (server.js won't work directly) ⚠️

---

## 💡 Future Improvements

* 📊 Map visualization integration
* 📋 Copy to clipboard feature
* 🧠 Add IP threat intelligence (AbuseIPDB, VirusTotal)
* 📈 Save search history

---

## 👨‍💻 Author

Nomul Premkumar Chiranjeevi

---

