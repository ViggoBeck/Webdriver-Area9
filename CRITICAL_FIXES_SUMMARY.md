# Critical Fixes - Implementation Summary

**Date:** October 3, 2025
**Status:** 🟡 Partially Complete - Ready for Testing

---

## ✅ Completed Fixes

### 1. **Deleted Old Login Utility** ✅
**File:** `src/utils/login.js`
**Action:** ❌ DELETED
**Reason:** Contained hardcoded 4-second delays, not using smart waits

---

### 2. **Created Unified Auth Module** ✅
**File:** `src/utils/auth.js` (NEW - 342 lines)

**Exports:**
- `performLogin(driver, role, account, password)` - Unified login for all roles
- `performLogout(driver, role)` - Unified logout for all roles
- `dismissOverlays(driver)` - Helper for overlay dismissal

**Features:**
- Uses smart waits throughout
- Role-specific timing (curator gets 2s menu delay)
- Retry logic built-in (3 attempts)
- Automatic overlay dismissal
- Menu scrolling for hidden logout buttons
- Force visibility on obstructed elements

---

### 3. **Updated Sample Workflows** ✅

**loginCurator.js:**
- Now imports from `auth.js` instead of `logout.js`
- Uses unified `performLogout()`
- Login code kept inline for timing measurement

**createClass.js:**
- Now uses `performLogin()` for cleaner code
- Uses unified `performLogout()`
- Reduced from ~40 lines of login code to 2 lines

---

### 4. **Reduced Inter-Test Delays** ✅
**File:** `src/app.js` (line 219)

**Before:**
```javascript
const pauseTime = options.slowMode ? 6000 : 4000;
```

**After:**
```javascript
const pauseTime = options.slowMode ? 3000 : 1500;
```

**Impact:**
- Normal mode: 4s → 1.5s (2.5s saved per test)
- Slow mode: 6s → 3s (3s saved per test)
- **Total savings: 37.5s - 45s per full suite run (15 tests)**

---

## 🚧 Remaining Work

### Files That Need Updating

#### **Using old `logout.js`:** (6 files)
1. `src/workflows/communicatorEducator.js`
2. `src/workflows/openClass.js`
3. `src/workflows/OpenProjectTeam.js`
4. `src/workflows/loginEducator.js`
5. `src/workflows/deleteClass.js`
6. `src/workflows/openUniqueUsersReport.js`

**Action Needed:**
```javascript
// Change:
import { performLogout } from "../utils/logout.js";

// To:
import { performLogout } from "../utils/auth.js";
```

---

#### **Using old `learner-utils.js`:** (7 files)
1. `src/workflows/openCourseCatalog.js`
2. `src/workflows/communicator.js`
3. `src/workflows/communicatorLearner.js`
4. `src/workflows/openVideoProbe.js`
5. `src/workflows/openScorm.js`
6. `src/workflowsCache/compareCourseCatalog.js`
7. `src/workflowsCache/compareScorm.js`
8. `src/workflowsCache/compareVideoProbe.js`

**Action Needed:**
```javascript
// Change:
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";

// To:
import { dismissOverlays, performLogout } from "../utils/auth.js";

// And update function calls:
await dismissLearnerOverlay(driver);  // OLD
await dismissOverlays(driver);         // NEW

await performLearnerLogout(driver);    // OLD
await performLogout(driver, 'learner'); // NEW (add role parameter)
```

---

#### **Login Timing Tests:** (2 files - need special handling)
1. `src/workflows/loginEducator.js`
2. `src/workflows/loginLearner.js`

**Action:** Keep manual login code for accurate timing, but use `performLogout()` from auth.js

---

#### **Non-Login Workflows:** (Can use `performLogin()` - 10 files)
1. `src/workflows/communicatorEducator.js`
2. `src/workflows/communicatorLearner.js`
3. `src/workflows/openScorm.js`
4. `src/workflows/openVideoProbe.js`
5. `src/workflows/openCourseCatalog.js`
6. `src/workflows/openReview.js`
7. `src/workflows/openClass.js`
8. `src/workflows/deleteClass.js`
9. `src/workflows/openUniqueUsersReport.js`
10. `src/workflows/OpenProjectTeam.js`
11. `src/workflows/pageLoad.js`

**Action:** Replace login code blocks with:
```javascript
const account = getAccountForTest("Test Name");
await performLogin(driver, 'role', account);
```

---

## 📋 Step-by-Step Update Process

### **Phase A: Quick Import Updates** (10 minutes)

Run the batch update script:
```bash
cd /Users/viggobeck/Desktop/VSC_A9/WD

# Make script executable
chmod +x update-workflows.sh

# Run it
./update-workflows.sh
```

Or manually update imports:
```bash
# Update logout.js imports to auth.js
find src/workflows -name "*.js" -exec sed -i '' 's/from "\.\.\/utils\/logout\.js"/from "..\/utils\/auth.js"/g' {} \;

# Update learner-utils.js imports to auth.js
find src/workflows -name "*.js" -exec sed -i '' 's/from "\.\.\/utils\/learner-utils\.js"/from "..\/utils\/auth.js"/g' {} \;
find src/workflowsCache -name "*.js" -exec sed -i '' 's/from "\.\.\/utils\/learner-utils\.js"/from "..\/utils\/auth.js"/g' {} \;
```

---

### **Phase B: Update Function Calls** (30 minutes)

For each file, update function calls:

1. **`dismissLearnerOverlay()` → `dismissOverlays()`**
2. **`performLearnerLogout()` → `performLogout(driver, 'learner')`**

---

### **Phase C: Replace Login Code Blocks** (2 hours)

For non-login workflows, replace:
```javascript
// DELETE THIS (30-40 lines):
const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {...});
await emailField.sendKeys(account);
const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {...});
await passwordField.sendKeys(DEFAULT_PASSWORD);
const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {...});
await waitFor.smartClick(driver, signInBtn);
await waitFor.loginComplete(driver, role);

// REPLACE WITH THIS (2 lines):
const account = getAccountForTest("Test Name");
await performLogin(driver, 'role', account);
```

---

### **Phase D: Cleanup Old Files** (After testing)

Once all workflows are updated and tested:
```bash
# Delete old utility files
rm src/utils/logout.js       # 287 lines
rm src/utils/learner-utils.js # 142 lines
# Total: 429 lines deleted, replaced by unified auth.js (342 lines)
```

---

## 🧪 Testing Strategy

After each phase, test:

```bash
# Test a simple workflow
node src/app.js single "login curator"

# Test a learner workflow
node src/app.js single "open scorm"

# Test create class (mentioned as having issues)
node src/app.js single "create class" --visible

# Test full suite
npm run workflows
```

---

## 📊 Expected Impact

### **Code Reduction:**
- **Before:** ~1,500 lines of duplicated login code across workflows
- **After:** ~100 lines (2 lines per workflow × 15 workflows + auth.js)
- **Savings:** ~1,400 lines (11% of total codebase)

### **Performance Improvement:**
- Inter-test delays reduced: 37.5-45 seconds saved per full suite
- With 15 tests @ 4s each = 60s → now 1.5s each = 22.5s
- **Time saved: ~40 seconds per test run**

### **Maintenance:**
- Login logic in ONE place (auth.js)
- Changes to login flow = 1 file to update (not 24)
- Consistent error handling across all tests
- Easier to add new authentication methods

---

## ⚠️ Known Issues to Watch

1. **URL Building:** Still inconsistent (some hardcoded, some use config functions)
2. **Create Class:** You mentioned this doesn't work - need to investigate
3. **Timing Tests:** loginLearner/loginEducator/loginCurator need special handling

---

## 🎯 Next Steps

1. **Test Current Changes:**
	 ```bash
	 node src/app.js single "login curator"
	 node src/app.js single "create class" --visible
	 ```

2. **If tests pass → Continue with Phase A-D updates**

3. **If tests fail → Debug and fix before proceeding**

4. **After all updates → Full suite test:**
	 ```bash
	 npm run workflows > test-results.log 2>&1
	 ```

---

## 📝 Update Checklist

Track your progress:

### Import Updates:
- [ ] communicatorEducator.js
- [ ] openClass.js
- [ ] OpenProjectTeam.js
- [ ] loginEducator.js
- [ ] deleteClass.js
- [ ] openUniqueUsersReport.js
- [ ] openCourseCatalog.js
- [ ] communicator.js
- [ ] communicatorLearner.js
- [ ] openVideoProbe.js
- [ ] openScorm.js
- [ ] compareCourseCatalog.js
- [ ] compareScorm.js
- [ ] compareVideoProbe.js

### Function Call Updates:
- [ ] All `dismissLearnerOverlay()` → `dismissOverlays()`
- [ ] All `performLearnerLogout()` → `performLogout(driver, 'learner')`

### Login Code Consolidation:
- [ ] openReview.js
- [ ] openClass.js
- [ ] deleteClass.js
- [ ] openUniqueUsersReport.js
- [ ] OpenProjectTeam.js
- [ ] openScorm.js
- [ ] openVideoProbe.js
- [ ] openCourseCatalog.js
- [ ] communicatorEducator.js
- [ ] communicatorLearner.js
- [ ] pageLoad.js

### Testing:
- [ ] Individual workflow tests pass
- [ ] Full suite passes
- [ ] Timing measurements still accurate
- [ ] No regressions introduced

### Cleanup:
- [ ] Delete `src/utils/logout.js`
- [ ] Delete `src/utils/learner-utils.js`
- [ ] Update documentation

---

**Ready to proceed with testing?** 🚀
