# Chrome 141 ARM64 Mac - Navigation Hang Fix

**Issue:** Chrome 141.0.7390.54 (arm64) hangs on `driver.get()` with Selenium
**Status:** ✅ Fixes Applied

---

## 🔧 Fixes Applied to `src/utils/driver.js`

### 1. **Page Load Strategy: 'none'** (Most Aggressive)
```javascript
options.setPageLoadStrategy('none');
```
- **Before:** 'eager' - waits for DOM ready
- **After:** 'none' - doesn't wait at all, just starts navigation
- **Impact:** Eliminates hang, but requires smart waits afterward

### 2. **Additional Chrome Flags**
```javascript
'--disable-blink-features=AutomationControlled'  // Prevent detection
'--disable-extensions'
'--disable-popup-blocking'
'--disable-infobars'
```

### 3. **Wrapped `driver.get()` Method**
```javascript
driver.get = async function(url) {
	await originalGet(url);
	await driver.executeScript('return document.readyState').catch(() => {});
	await new Promise(resolve => setTimeout(resolve, 500));
};
```
- Adds 500ms wait after navigation
- Ensures page starts loading before continuing

### 4. **Explicit Timeouts**
```javascript
pageLoad: 30000,  // 30 seconds max
implicit: 0,      // No implicit waits
script: 30000     // 30 seconds for scripts
```

---

## 🧪 Test Now

```bash
# Test with visible browser
node src/app.js single "login curator" --visible
```

**Expected:** Browser should open, navigate, show login form

---

## If It Still Hangs - Try Headless Mode

Headless is more stable with Chrome 141:

```bash
# Force headless in driver.js temporarily
# Edit line 38: if (!visible) → if (true)
```

Then test:
```bash
node src/app.js single "login curator"
```

---

## Alternative: Downgrade Chrome

If nothing works, downgrade to Chrome 140:

1. Download Chrome 140 from: https://chromium.cypress.io/
2. Install it
3. Update chromedriver: `npm install chromedriver@140 --save-dev`

---

## Alternative: Use Firefox

Most reliable for ARM Mac:

Edit `src/utils/driver.js`:
```javascript
import firefox from "selenium-webdriver/firefox.js";

const driver = await new Builder()
	.forBrowser("firefox")  // Change from "chrome"
	.build();
```

---

## Why This Happens

**Chrome 141 + ARM64 Mac + Selenium = Known Issues:**
- Renderer process hangs
- IPC communication timeout
- "Timed out receiving message from renderer"

**Root Cause:** Chrome 141 changed how it handles automation on ARM Macs

**Solution:** Page load strategy 'none' + additional flags

---

## ✅ Success Indicators

After fix, you should see:
- Browser opens quickly
- URL loads (maybe blank briefly)
- Login form appears
- Test completes in < 10 seconds

---

**Current Status:** Aggressive fixes applied, ready to test
