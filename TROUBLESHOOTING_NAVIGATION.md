# Navigation Timeout Troubleshooting

**Issue:** Tests hanging with "Timed out receiving message from renderer"

**Date:** October 3, 2025

---

## 🔴 Current Problem

```
Error: timeout: Timed out receiving message from renderer: 297.009
```

This means `driver.get(URL)` is hanging - the page never finishes loading.

---

## ✅ Fixes Applied

### 1. Added Page Load Timeout (Just Applied)
**File:** `src/utils/driver.js`

```javascript
// Set timeouts to prevent hanging
await driver.manage().setTimeouts({
	pageLoad: 30000,      // 30 seconds for page load
	implicit: 0,          // Don't use implicit waits
	script: 30000         // 30 seconds for async scripts
});
```

**Impact:** Now fails after 30s instead of 297s

### 2. Removed Problematic Chrome Flags (Just Applied)
**File:** `src/utils/driver.js`

**Removed:**
```javascript
'--disable-web-security',      // Can cause issues
'--allow-running-insecure-content'  // Can cause issues
```

**Kept:**
```javascript
'--no-sandbox',           // Required for some environments
'--disable-dev-shm-usage' // Prevents memory issues
```

---

## 🧪 Test Now

Try running the test again:

```bash
node src/app.js single "login curator" --visible
```

Watch the browser window - does it:
- ✅ Open Chrome?
- ✅ Navigate to the URL?
- ❌ Show a blank page?
- ❌ Show an error page?
- ❌ Get stuck loading?

---

## 🔍 Diagnostic Steps

### Step 1: Test URL Directly in Browser

Open Chrome manually and go to:
```
https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
```

**Does it load?**
- ✅ YES → Issue is with Selenium/Chrome driver config
- ❌ NO → Issue is with the URL or network

### Step 2: Check Chrome Version

```bash
# Check your Chrome version
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
```

**Known Issues:**
- Chrome 141+ sometimes has Selenium compatibility issues
- Mismatch between Chrome and ChromeDriver versions

### Step 3: Test Different Workflow

```bash
# Try a learner workflow (you said these work)
node src/app.js single "open scorm" --visible
```

**If learner works but curator doesn't:**
- Issue is URL-specific (curator.html vs learner.html)

### Step 4: Test with Explicit ChromeDriver

Install a specific ChromeDriver version:

```bash
npm install chromedriver@141 --save-dev
```

Then update `driver.js` to use it explicitly.

---

## 🛠️ Additional Fixes to Try

### Option A: Add More Aggressive Timeouts

**File:** `src/utils/driver.js`

```javascript
// Even shorter timeout
await driver.manage().setTimeouts({
	pageLoad: 15000,  // 15 seconds
	implicit: 0,
	script: 15000
});
```

### Option B: Use Different Page Load Strategy

**File:** `src/utils/driver.js`

```javascript
options.setPageLoadStrategy('eager');  // Don't wait for all resources
// or
options.setPageLoadStrategy('none');   // Don't wait at all (fastest but risky)
```

Add this before building the driver:
```javascript
const options = new chrome.Options();
options.setPageLoadStrategy('eager');  // Add this line
```

### Option C: Add Headless Mode (Most Stable)

**File:** `src/utils/driver.js`

```javascript
if (!visible) {
	options.addArguments([
		...baseOptions,
		'--headless=new',  // Use new headless mode
		'--disable-gpu'
	]);
}
```

### Option D: Check Network Issues

```bash
# Ping the server
ping br.uat.sg.rhapsode.com

# Check if server is accessible
curl -I https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
```

---

## 📋 Quick Fixes to Try (In Order)

### 1. Test Current Changes
```bash
node src/app.js single "login curator" --visible
```

### 2. If Still Hangs - Try Page Load Strategy
Edit `src/utils/driver.js`, add after line 32:

```javascript
const options = new chrome.Options();
options.setPageLoadStrategy('eager');  // ADD THIS LINE
```

### 3. If Still Hangs - Try Lower Timeout
Edit `src/utils/driver.js`, change line with `pageLoad`:

```javascript
pageLoad: 10000,  // 10 seconds instead of 30
```

### 4. If Still Hangs - Test Learner Workflow
```bash
node src/app.js single "open scorm" --visible
```

If learner works → Issue is with curator/educator URLs specifically

### 5. If Nothing Works - Check Chrome Version
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
node -p "require('selenium-webdriver/chrome').ServiceBuilder"
```

---

## 🤔 Possible Root Causes

### 1. Chrome/ChromeDriver Mismatch
**Symptoms:** Navigation hangs, timeouts
**Fix:** Update ChromeDriver to match Chrome version

### 2. Network/Firewall Issue
**Symptoms:** Some URLs work, others don't
**Fix:** Check network, VPN, corporate proxy

### 3. JavaScript Blocking Page Load
**Symptoms:** Page loads but never "finishes"
**Fix:** Use `eager` page load strategy

### 4. Selenium Bug
**Symptoms:** Random hangs, inconsistent behavior
**Fix:** Update selenium-webdriver: `npm update selenium-webdriver`

### 5. Application-Specific Issue
**Symptoms:** Only happens with certain URLs
**Fix:** Report to application team

---

## 📊 Expected Behavior vs Actual

### Expected:
```
✅ Configuration loaded successfully
✅ Found exact match: Login Curator
🚀 Starting Single Test: Login Curator...
⏳ Running: Login Curator
👤 Using account: A9-106810@area9.dk
🌐 Navigating to curator URL...
✅ Page loaded in 2.3s
✅ Login Curator completed: 3.45s
```

### Actual:
```
✅ Configuration loaded successfully
✅ Found exact match: Login Curator
🚀 Starting Single Test: Login Curator...
⏳ Running: Login Curator
👤 Using account: A9-106810@area9.dk
❌ timeout: Timed out receiving message from renderer: 297.009
```

**Problem:** Page never loads, hangs for 297 seconds

---

## 🆘 If All Else Fails

### Last Resort Options:

1. **Use headless mode** (more stable):
	 ```bash
	 # Edit driver.js to force headless
	 # Change line 38: if (!visible) → if (true)
	 ```

2. **Use different browser** (Firefox):
	 ```javascript
	 const driver = await new Builder()
		 .forBrowser("firefox")  // Change from "chrome"
		 .build();
	 ```

3. **Test in Docker** (isolated environment):
	 ```bash
	 docker run -it --rm selenium/standalone-chrome
	 ```

4. **Check if it's environment-specific**:
	 - Try on different machine
	 - Try on different network
	 - Try with VPN off/on

---

## ✅ Success Checklist

After trying fixes, you should see:

- [ ] Browser opens
- [ ] URL loads in browser
- [ ] Login form appears
- [ ] Test completes without timeout
- [ ] Timing is reasonable (< 10 seconds)

---

**Current Status:** Page load timeout added + Chrome flags removed

**Next Step:** Test with `node src/app.js single "login curator" --visible`

**Watch for:** Does the browser open? Does the page load? Where does it get stuck?
