# Area9 Performance Test Suite

Automated performance testing for Area9 learning platform.

## Quick Setup

```bash
# 1. Install
npm install

# 2. Set password
cp .env.example .env
# Edit .env and add your password: DEFAULT_PASSWORD=your_password_here

# 3. Run tests
npm run priority-watch
```

## Basic Commands

```bash
# Watch 6 priority tests (recommended for first time)
npm run priority-watch

# Run all 15 tests (watch mode)
npm run working-watch

# Run cache comparison tests (visible)
node src/app.js cache --visible --slow

# Run specific test
node src/app.js single "login learner" --visible --slow
```

## Single Test Commands

### Regular Tests (15 total)
```bash
# Login Tests
node src/app.js single "login learner" --visible --slow
node src/app.js single "login educator" --visible --slow
node src/app.js single "login curator" --visible --slow

# Communication Tests
node src/app.js single "communicator learner" --visible --slow
node src/app.js single "communicator educator" --visible --slow

# Content Tests
node src/app.js single "open scorm" --visible --slow
node src/app.js single "open video probe" --visible --slow
node src/app.js single "open course catalog" --visible --slow
node src/app.js single "open review" --visible --slow

# Analytics Tests
node src/app.js single "open unique users report" --visible --slow
node src/app.js single "open project team activity" --visible --slow

# Class Management Tests
node src/app.js single "open class" --visible --slow
node src/app.js single "create class" --visible --slow
node src/app.js single "delete class" --visible --slow

# Performance Tests
node src/app.js single "page load" --visible --slow
```

### Cache Comparison Tests (9 total - Cold vs Warm)
```bash
# Login Cache Tests
node src/app.js single "login learner cache" --visible --slow
node src/app.js single "login educator cache" --visible --slow
node src/app.js single "login curator cache" --visible --slow

# Content Cache Tests
node src/app.js single "scorm cache" --visible --slow
node src/app.js single "video probe cache" --visible --slow
node src/app.js single "review cache" --visible --slow
node src/app.js single "course catalog cache" --visible --slow
node src/app.js single "open class cache" --visible --slow

# Performance Cache Tests
node src/app.js single "page load cache" --visible --slow    # Best cache results! (75%+ improvement)
```

### Quick Commands (Headless)
```bash
# Remove --visible --slow for fast headless execution
node src/app.js single "login learner"
node src/app.js single "page load cache"
node src/app.js single "scorm cache"
# ... (any test above)
```

### Partial Matching Examples
```bash
# These work due to smart partial matching:
node src/app.js single "learner" --visible        # → Login Learner (regular test preferred)
node src/app.js single "learner cache" --visible  # → Login Learner Cache
node src/app.js single "scorm" --visible          # → SCORM Cache (cache test preferred)
node src/app.js single "video" --visible          # → Video Probe Cache
node src/app.js single "class" --visible          # → Open Class (regular)
node src/app.js single "class cache" --visible    # → Open Class Cache
```

## Available Tests (15 total)

### Regular Tests
- **Login Learner** (~4s) - Student login
- **Login Educator** (~3s) - Teacher login
- **Login Curator** (~3s) - Admin login
- **Communicator Learner** (~7s) - Student messaging
- **Communicator Educator** (~10s) - Teacher messaging
- **Open SCORM** (~2s) - Learning content
- **Open Video Probe** (~2s) - Video content
- **Open Course Catalog** (~1s) - Course browsing
- **Open Review** (~4s) - Review system
- **Open Unique Users Report** (~0.5s) - User analytics
- **Open Project Team Activity** (~0.5s) - Team analytics
- **Open Class** (~1s) - Class dashboard
- **Create Class** (~1s) - Create new class
- **Delete Class** (~2s) - Clean up test data
- **Page Load** (~3s) - Pure page load performance using Performance API

### Cache Tests (9 total)
Tests that run the same action twice to measure caching benefits:

```bash
# Run cache comparison tests
node src/app.js cache --visible --slow

# Available cache tests:
# - Login Learner Cache (cold vs warm login performance)
# - Login Educator Cache (cold vs warm login performance)
# - Login Curator Cache (cold vs warm login performance)
# - SCORM Cache (cold vs warm)
# - Video Probe Cache (cold vs warm)
# - Review Cache (cold vs warm)
# - Course Catalog Cache (cold vs warm)
# - Open Class Cache (cold vs warm)
# - Page Load Cache (cold vs warm) - Shows biggest cache benefits (60-75%!)
```

## Simple Commands

| Command | What it does |
|---------|-------------|
| `npm run priority-watch` | Run 6 core tests (visible) |
| `npm run working-watch` | Run all 15 tests (visible) |
| `node src/app.js cache -v -s` | Run 9 cache comparison tests (visible) |
| `node src/app.js single "page load cache" -v` | Best cache test (75% improvement!) |
| `npm run create` | Create test class (visible) |
| `npm run delete` | Delete test class (visible) |
| `npm run show-accounts` | Show which account each test uses |

## Configuration

Only one setting needed in `.env` file:
```
DEFAULT_PASSWORD=your_actual_password
```

## Results

Test results are automatically saved to organized CSV files for comprehensive analysis:

### 📊 **Structured Data Output:**
```
results/
├── results-normal.csv          # Normal workflow tests (baseline performance)
├── results-cold.csv            # Cold cache test results
├── results-warm.csv            # Warm cache test results
└── results-cache-comparison.csv # Side-by-side cold vs warm analysis
```

### 📋 **CSV Formats:**

**Normal Tests** (baseline performance):
```csv
timestamp,test_name,execution_time,account
2025-09-24T13:50:06.553Z,Page Load,0.749,A9-106826@area9.dk
```

**Cache Comparison** (optimization insights):
```csv
timestamp,test_name,cold_time,warm_time,improvement_seconds,improvement_percent,account
2025-09-24T13:50:06.553Z,Page Load,2.234,0.749,1.485,66.5%,A9-106826@area9.dk
```

### 🎯 **Data Analysis Use Cases:**

- **Performance Trends**: Track baseline performance over time (normal.csv)
- **Cache Effectiveness**: Measure optimization impact (comparison.csv)
- **Individual Metrics**: Analyze cold starts vs warm performance separately
- **Account Patterns**: Performance differences across test accounts

### 📊 **Example Data Analysis:**
```bash
# Generate comprehensive performance data
npm run working-watch          # Baseline performance → results-normal.csv
node src/app.js cache -v       # Cache benefits → results-cache-comparison.csv

# Best tests for cache analysis:
node src/app.js single "page load cache" -v      # 75% improvement
node src/app.js single "login learner cache" -v  # 3% improvement
node src/app.js single "login educator cache" -v # 3% improvement
node src/app.js single "login curator cache" -v  # 3% improvement
```

**Sample Results:**
```csv
# results-cache-comparison.csv
2025-09-24,Page Load,2.234,0.749,1.485,66.5%,A9-106826@area9.dk
2025-09-24,Login Learner,3.258,3.144,0.114,3.5%,A9-106821@area9.dk
2025-09-24,Login Educator,3.124,3.021,0.103,3.3%,A9-106816@area9.dk
2025-09-24,Login Curator,3.337,3.201,0.136,4.1%,A9-106810@area9.dk
```

## Troubleshooting

**"Configuration Error"** → Check `.env` file has `DEFAULT_PASSWORD`

**Test fails** → Try running with `--visible --slow` to see what happens:
```bash
node src/app.js single "test name" --visible --slow
```

**Browser issues** → Update Chrome or restart terminal

## Test Accounts

Each test uses a unique account (no conflicts):
- **Learner accounts**: A9-106821@area9.dk to A9-106830@area9.dk
- **Educator accounts**: A9-106816@area9.dk to A9-106820@area9.dk
- **Curator accounts**: A9-106810@area9.dk to A9-106815@area9.dk

**Total**: 15 regular tests + 9 cache tests = **24 comprehensive performance tests**

Run `npm run show-accounts` to see exact assignments.

## 📈 **Expected Cache Performance Gains:**
- **Page Load**: 60-75% improvement (biggest gains)
- **SCORM/Video**: 15-25% improvement
- **Login Tests (All Roles)**: 3-5% improvement (mostly server-side authentication)
	- Login Learner Cache
	- Login Educator Cache
	- Login Curator Cache
- **Content Operations**: 10-20% improvement (SCORM, Reviews, Catalog)