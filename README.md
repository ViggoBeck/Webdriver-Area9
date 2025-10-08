# Area9 Performance Test Suite

Automated performance testing for Area9 learning platform with configurable logging and robust element handling.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env: DEFAULT_PASSWORD=your_password
npm start              # Run normal workflows
npm run cache          # Run cache comparison tests
```

## Key Features ✨

- **Configurable Logging** - Control verbosity with `LOG_LEVEL` (silent/error/warn/info/debug/verbose)
- **Robust Element Handling** - Automatic overlay dismissal and click retries
- **Smart Waits** - Progressive timeouts (2s → 5s → 15s) instead of hardcoded delays
- **Network Idle Detection** - Waits for actual page readiness, not arbitrary timeouts
- **Cache Comparison** - Measure cold vs warm performance
- **CI/CD Ready** - Headless mode for automated testing

## Configuration

Edit `.env`:
```env
DEFAULT_PASSWORD=your_password

# Logging (optional - defaults to 'info')
LOG_LEVEL=info     # silent|error|warn|info|debug|verbose
```

### Log Levels

| Level | Output | Use Case |
|-------|--------|----------|
| `silent` | Minimal | CI/CD, automated reports |
| `error` | Errors only | Production monitoring |
| `warn` | Errors + warnings | Normal with alerts |
| **`info`** | **Key events (default)** | **Daily development** ⭐ |
| `debug` | Detailed steps | Troubleshooting |
| `verbose` | Everything | Deep debugging |

## Available Tests

### Normal Workflows (16 tests)

```bash
npm start                     # Run all normal workflows
npm run workflows-visible     # Run with browser visible
```

**Authentication (3):**
- Login Learner (~3-4s)
- Login Educator (~3-4s)
- Login Curator (~3-4s)

**Content (5):**
- Open SCORM (~4.1s)
- Open Video Probe (~2s)
- Open Course Catalog (~1s)
- Open Review (~4s)
- Page Load (~10.6s)

**Communication (2):**
- Communicator Learner (~7s)
- Communicator Educator (~10s)

**Analytics (2):**
- Open Unique Users Report (~4.9s)
- Open Project Team Activity (~3.4s)

**Class Management (4):**
- Open Class (~1s)
- Create Class (~4.9s)
- Delete Class (~1.8s)

### Cache Comparison Tests (9 tests)

Tests run twice (cold then warm) to measure caching benefits:

```bash
npm run cache                 # Run all cache tests
npm run cache-visible         # Run with browser visible
```

- Page Load Cache (60-75% improvement)
- Login Learner Cache
- Login Educator Cache
- Login Curator Cache
- SCORM Cache
- Video Probe Cache
- Course Catalog Cache
- Open Class Cache
- Open Review Cache

## Running Specific Tests

```bash
# Normal workflows
node src/app.js single "login learner"
node src/app.js single "open course catalog"
node src/app.js single "create class"

# Cache tests
node src/app.js single "login learner cache"
node src/app.js single "scorm cache"

# With visual mode
node src/app.js single "login learner" --visible
```

## Results

Results are saved to organized CSV files:

```
results/
├── results-normal.csv              # Baseline performance
├── results-cold.csv                # Cold cache results
├── results-warm.csv                # Warm cache results
└── results-cache-comparison.csv    # Cold vs warm analysis
```

Clear results:
```bash
npm run clear-results
```

## Test Accounts

Tests use dedicated accounts to avoid conflicts:

- **Learner**: A9-106821@area9.dk to A9-106830@area9.dk
- **Educator**: A9-106816@area9.dk to A9-106820@area9.dk
- **Curator**: A9-106810@area9.dk to A9-106815@area9.dk

View assignments:
```bash
npm run show-accounts
```

## Troubleshooting

### Tests are too verbose
```bash
# Edit .env
LOG_LEVEL=info    # Recommended (default)
```

### Need to debug a failure
```bash
# Edit .env for more detail
LOG_LEVEL=debug

# Run with browser visible
node src/app.js single "test name" --visible
```

### Element not clickable errors
These are now handled automatically with:
- Automatic overlay dismissal
- JavaScript click fallback
- Element visibility forcing
- Retry logic with progressive delays

### Configuration error
Check `.env` has `DEFAULT_PASSWORD` set.

### Browser issues
Update Chrome or restart terminal.

## Architecture

### Core Utilities
- **`logger.js`** - Configurable logging with 6 levels
- **`smart-wait.js`** - Progressive timeout escalation (2s → 5s → 15s)
- **`network-wait.js`** - Network idle detection and monitoring
- **`app-ready.js`** - Application-specific ready state detection
- **`auth.js`** - Login/logout with overlay handling
- **`driver.js`** - WebDriver setup with unified API

### Workflow Structure
```javascript
import { logger } from "../utils/logger.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function workflowName(driver) {
	logger.info("🌐 Starting workflow...");

	const element = await waitFor.element(driver,
		selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true
	});

	logger.info("⏱ Workflow took: 2.345s");
}
```

## Recent Updates

**v2.0 (Oct 8, 2025):**
- ✅ Added configurable logger with 6 levels
- ✅ Fixed Course Catalog menu button issues
- ✅ Fixed SCORM/Video Probe click interception
- ✅ Updated all 30+ workflows to use logger
- ✅ ~80% reduction in log output at default level

See `CHANGELOG.md` for complete history.

## CI/CD Integration

The suite is ready for CI/CD with minimal output:

```bash
# In .env
LOG_LEVEL=silent

# Run tests
npm test
```

All tests are reliable and handle:
- Dynamic overlays
- Network timing variations
- Element stability issues
- Stale element references

## Documentation

- **`readme.md`** (this file) - Complete documentation
- **`QUICK_START.md`** - Quick reference guide
- **`CHANGELOG.md`** - Version history
- **`ALL_UPDATES_COMPLETE.md`** - Recent updates summary

## Status

**Current:** ✅ Ready for production use
**Tests:** 25 total (16 normal + 9 cache)
**Success Rate:** ~100% with retry logic
**Browser:** Chrome 141+ (auto-managed)

⚠️ **Tests interact with live UAT environment** - run manually for validation/benchmarking.

---

For quick reference, see `QUICK_START.md`.
