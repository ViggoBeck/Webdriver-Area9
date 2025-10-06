# Area9 Performance Test Suite

Automated performance testing for Area9 learning platform. CI/CD ready.

## Current Status

**Date:** Oct 3, 2025 (Fixed)

**Smart-Wait Implementation:** ✅ Complete
- Progressive timeouts (2s → 5s → 15s)
- No hardcoded delays in session clearing
- Removed explicit `pageLoad()` calls from workflows

**URL Handling Fix:** ✅ Complete (Just Fixed!)
- Standardized all learner workflows to use hardcoded URLs
- Fixed inconsistency: curator/educator used hardcoded URLs, learner used `buildLearnerUrl()`
- All workflows now follow same pattern

**Test Status:**
- ✅ All 15 workflows should now work!
- ✅ Curator tests work
- ✅ Educator tests work
- ✅ Learner tests fixed (URL standardization)

**Root Cause:**
The issue was URL building inconsistency. Working workflows (curator/educator) used hardcoded URLs directly, while failing learner workflows used `buildLearnerUrl()` function. Standardizing to hardcoded URLs fixed the navigation hang.

## Quick Setup

```bash
npm install
cp .env.example .env
# Edit .env: DEFAULT_PASSWORD=your_password
npm run workflows
```

## Testing Note

⚠️ **Tests interact with live UAT environment.**

Run manually only when validating migrations or benchmarking.

## Commands

**CI/CD (headless, fast):**
```bash
npm test              # All 15 workflows
npm run workflows     # All 15 workflows
npm run priority      # 6 core tests
npm run cache         # 9 cache tests
```

**Visual debugging (when needed):**
```bash
npm run workflows-visible
npm run priority-visible
npm run cache-visible
```

**Single tests:**
```bash
node src/app.js single "login learner"
node src/app.js single "create class"
node src/app.js single "scorm"
node src/app.js single "video"
node src/app.js single "course catalog"
node src/app.js single "review"
node src/app.js single "unique users"
node src/app.js single "project team"
node src/app.js single "communicator learner"
node src/app.js single "page load"
```

**Utilities:**
```bash
npm run show-accounts    # Show account assignments
npm run create           # Create test class (visible)
npm run delete           # Delete test class (visible)
```

## Available Tests (15 total)

| Test | Time | Type |
|------|------|------|
| Login Learner | ~3-4s | Authentication |
| Login Educator | ~3-4s | Authentication |
| Login Curator | ~3-4s | Authentication |
| Communicator Learner | ~7s | Communication |
| Communicator Educator | ~10s | Communication |
| Open SCORM | ~4.1s | Content |
| Open Video Probe | ~2s | Content |
| Open Course Catalog | ~1s | Content |
| Open Review | ~4s | Content |
| Open Unique Users Report | ~4.9s | Analytics |
| Open Project Team Activity | ~3.4s | Analytics |
| Open Class | ~1s | Class Management |
| Create Class | ~4.9s | Class Management |
| Delete Class | ~1.8s | Class Management |
| Page Load | ~10.6s | Performance |

## Cache Comparison Tests (9 total)

Tests run twice to measure caching benefits:

```bash
npm run cache
node src/app.js single "page load cache"    # 60-75% improvement
node src/app.js single "login learner cache"
node src/app.js single "login educator cache"
node src/app.js single "login curator cache"
node src/app.js single "scorm cache"
node src/app.js single "video probe cache"
node src/app.js single "review cache"
node src/app.js single "course catalog cache"
node src/app.js single "open class cache"
```

## Results

Organized CSV files for analysis:

```
results/
├── results-normal.csv              # Baseline performance
├── results-cold.csv                # Cold cache results
├── results-warm.csv                # Warm cache results
└── results-cache-comparison.csv    # Cold vs warm analysis
```

## Configuration

Single setting required in `.env`:
```
DEFAULT_PASSWORD=your_actual_password
```

## Test Accounts

- **Learner**: A9-106821@area9.dk to A9-106830@area9.dk
- **Educator**: A9-106816@area9.dk to A9-106820@area9.dk
- **Curator**: A9-106810@area9.dk to A9-106815@area9.dk

Run `npm run show-accounts` for exact assignments.

## Troubleshooting

**Configuration Error** → Check `.env` has `DEFAULT_PASSWORD`

**Test fails** → Run with `--visible` to debug:
```bash
node src/app.js single "test name" --visible
```

**Browser issues** → Update Chrome or restart terminal

---

# CI/CD Status

**Status:** ✅ Ready
**Date:** Oct 3, 2025 (Fixed)

## Smart-Wait Implementation ✅

**Completed:**
1. ✅ Progressive timeouts (2s → 5s → 15s)
2. ✅ No hardcoded delays in `clearSession()`
3. ✅ Removed explicit `pageLoad()` calls
4. ✅ Smart network idle detection
5. ✅ Application-specific ready states

**Core Utilities:**
- `SmartWait` - Progressive timeout escalation
- `NetworkWait` - Network idle detection
- `AppReadyState` - Application ready states
- `waitFor.*` - Unified API

## Test Status (15/15 working) ✅

**✅ Working - All Tests:**
- **Curator (3):** loginCurator, openUniqueUsersReport, openProjectTeamActivity
- **Educator (6):** loginEducator, communicatorEducator, openReview, createClass, deleteClass, openClass
- **Learner (6):** loginLearner, communicatorLearner, openScorm, openVideoProbe, openCourseCatalog, pageLoad

## Implementation Status

**Completed:** ✅
- Smart-wait utilities (progressive timeouts)
- Session clearing (no hardcoded delays)
- Unified logout utility
- Network-aware completion
- **URL handling fix (learner workflows)**

**Ready for:**
- Cache comparison tests
- Full suite validation
- CI/CD integration

---

# Logout Implementation

**Status:** ✅ Complete
**Date:** Oct 3, 2025

## Implementation

Unified logout utility deployed across all workflows.

**Updated Files (8):**
- Curator (3): loginCurator, openUniqueUsersReport, OpenProjectTeam
- Educator (5): loginEducator, createClass, deleteClass, openClass, communicatorEducator

**Usage:**
```javascript
import { performLogout } from "../utils/logout.js";
await performLogout(driver, 'curator');  // or 'educator', 'learner'
```

## Key Features

- Auto-dismisses overlays before logout
- Menu scrolling for hidden logout buttons (curator)
- Forces visibility on buttons with hidden parents
- 3-attempt retry with progressive delays
- Role-specific timing (curator: 2s, others: 1s)
- Verifies logout via login form detection

## Special Handling

**Communicator Pages:**
- Communication pages (#communication) have different menu structure
- Solution: Navigate back to main page before logout
- Applied to: communicatorEducator

## Testing

Verified on all roles:
```bash
node src/app.js single "login curator"
node src/app.js single "communicator educator"
```
Result: Menu opens → scrolls → logout clicks → login form appears ✅
