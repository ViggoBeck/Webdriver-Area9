# Area9 Performance Test Suite

Automated performance testing framework for the Area9 learning platform with comprehensive coverage of core functionality including logins, content navigation, analytics, and class management.

## Quick Start

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your actual password
# DEFAULT_PASSWORD=your_actual_password
```

### 2. Run Tests
```bash
# Run 6 priority tests (core functionality)
npm run priority-watch

# Run all 13 working tests
npm run working-watch

# Run single test
node src/app.js single "login learner" --visible --slow
```

## Available Tests

### ✅ Working Tests (13)

#### **Authentication & Core (3 tests)**
- **Login Learner** (~3-6s) - Learner dashboard login flow with onboarding overlay dismissal and automatic logout
- **Login Educator** (~3s) - Educator dashboard login flow
- **Login Curator** (~3s) - Curator dashboard login flow

#### **Communication (2 tests)**
- **Communicator Learner** (~6-9s) - Learner communication interface
- **Communicator Educator** (~6-17s) - Educator communication interface

#### **Content Navigation (4 tests)**
- **Open SCORM** (~2-8s) - SCORM content loading in TO-DO section
- **Open Video Probe** (~1-5s) - Video content loading performance
- **Open Course Catalog** (~1s) - Course catalog navigation speed
- **Open Review** (~4s) - Review functionality access

#### **Analytics & Reports (2 tests)**
- **Open Unique Users Report** (~0.1-5s) - Curator analytics: unique users
- **Open Project Team Activity** (~0.3-5s) - Curator analytics: project teams

#### **Class Management (2 tests)**
- **Open Class** (~0.9-8s) - Educator class dashboard with learner performance
- **Create Class** (~0.8-2.5s) - Class creation workflow with "Test" name

### 🎯 Priority Tests (6)
Core functionality that forms the foundation: Login (3) + Communication (2) + Course Catalog (1)

## Commands

### **Test Suite Commands**
| Command | Description |
|---------|-------------|
| `npm run priority` | Run 6 priority tests (headless with cache) |
| `npm run priority-watch` | Run priority tests (visible + slow with cache) |
| `npm run priority-cold` | Run priority tests without cache (cold load performance) |
| `npm run priority-cold-watch` | Run priority tests without cache (visible + slow) |
| `npm run working` | Run all 13 working tests (headless with cache) |
| `npm run working-watch` | Run all working tests (visible + slow with cache) |
| `npm run working-cold` | Run all working tests without cache (cold load performance) |
| `npm run working-cold-watch` | Run all working tests without cache (visible + slow) |
| `npm run show-accounts` | Display account assignments |

### **Individual Test Commands**
| Command | Test | Expected Time |
|---------|------|---------------|
| `npm run scorm` | Open SCORM content | ~2-8s |
| `npm run video` | Open Video Probe | ~1-5s |
| `npm run catalog` | Open Course Catalog | ~1s |
| `npm run analytics` | Open Unique Users Report | ~0.1-5s |
| `npm run project` | Open Project Team Activity | ~0.3-5s |
| `npm run class` | Open Class Dashboard | ~0.9-8s |
| `npm run create` | Create Class | ~0.8-2.5s |

### **Utility Commands**
| Command | Description |
|---------|-------------|
| `npm run clear-results` | Clear legacy results.csv file |
| `npm run clear-results-warm` | Clear warm load results only |
| `npm run clear-results-cold` | Clear cold load results only |
| `npm run clear-results-all` | Clear all result files (warm, cold, all, legacy) |
| `npm run show-accounts` | Show account assignments for each test |

### **Cache Control Testing**

The framework supports testing both **cold load** (no cache) and **warm load** (with cache) performance:

```bash
# Cache Control Options
--no-cache, --disable-cache, -nc  # Disable browser cache for cold load testing

# Compare Cache vs No-Cache Performance
npm run priority                  # Warm load with cache
npm run priority-cold             # Cold load without cache

# Watch cache behavior
npm run working-cold-watch        # Visual cold load testing
npm run working-watch             # Visual warm load testing

# Single test cache control
node src/app.js single "login learner" --no-cache -v    # Cold load login test
node src/app.js single "open scorm" -nc --visible       # Cold load SCORM test
```

**Cache Control Features:**
- 🚫 **Complete cache disabling**: Application cache, disk cache, media cache
- 🧹 **Background process disabling**: Extensions, sync, default apps
- ⚡ **Performance comparison**: Easy A/B testing of cold vs warm performance
- 📊 **Separate metrics**: Results show whether cache was enabled/disabled

### **Advanced Usage**
```bash
# Run specific test types with cache control
node src/app.js single "login" --visible --no-cache     # Any login test (cold)
node src/app.js single "communicator" --visible         # Any communicator test (warm)
node src/app.js single "open" --visible --no-cache      # Any "open" functionality (cold)
node src/app.js single "unique" --visible               # Unique Users Report (warm)

# Different modes
node src/app.js working                           # Headless mode with cache
node src/app.js working --no-cache                # Headless mode without cache
node src/app.js working --visible                 # Watch browser with cache
node src/app.js working --visible --no-cache      # Watch browser without cache

# Combined options
node src/app.js single "create class" -v -s -nc   # Visual + slow + no cache
node src/app.js priority --visible --slow --no-cache  # Full debugging cold load
```

## Configuration

### Environment Variables (.env)
- `DEFAULT_PASSWORD` - Password for all test accounts (**required**)
- `BASE_URL` - Base URL for tests (optional, defaults to UAT)
- `SKIN_PARAM` - Skin parameter (optional, has default)
- `DEFAULT_TIMEOUT` - Element wait timeout in ms (optional, default 20000)

### Test Accounts & Isolation
Each test uses a dedicated account to prevent conflicts and enable parallel testing:

#### **Account Pool (21 total accounts)**
- **Learner accounts**: A9-106821@area9.dk to A9-106830@area9.dk (10 accounts)
- **Educator accounts**: A9-106816@area9.dk to A9-106820@area9.dk (5 accounts)
- **Curator accounts**: A9-106810@area9.dk to A9-106815@area9.dk (6 accounts)

#### **Test Isolation Strategy**
- ✅ **Unique accounts**: Each test has a dedicated account (no sharing)
- ✅ **Session clearing**: Complete browser session reset between tests
- ✅ **Parallel safe**: Multiple tests can run simultaneously without conflicts
- ✅ **Role separation**: Learner/Educator/Curator tests use appropriate accounts

#### **Account Assignment Examples**
```bash
# View complete account mapping
npm run show-accounts

# Sample assignments:
# Login Learner        → A9-106821@area9.dk
# Open SCORM          → A9-106823@area9.dk
# Open Class          → A9-106820@area9.dk
# Unique Users Report → A9-106811@area9.dk
```

## Results & Monitoring

Test results are automatically logged to separate files based on cache status:

### **Result File Structure**
```
results/
├── results-warm.csv     # Tests run with cache enabled (warm load)
├── results-cold.csv     # Tests run with cache disabled (cold load)
├── results-all.csv      # All tests with cache status column
results.csv              # Legacy file (backward compatibility)
```

**File Format**: `timestamp,test_name,execution_time,cache_status`
- Cache status: `WARM` (with cache) or `COLD` (without cache)
- Execution time: seconds (number) or `ERROR`

### **Managing Results**
```bash
# View recent results by type
tail -10 results/results-warm.csv       # Recent warm load results
tail -10 results/results-cold.csv       # Recent cold load results
tail -10 results/results-all.csv        # Recent all results with cache status

# View legacy results (backward compatibility)
tail -10 results.csv                    # All results without cache status

# Clear specific result types
npm run clear-results-warm              # Clear only warm load results
npm run clear-results-cold              # Clear only cold load results
npm run clear-results-all               # Clear all result files
npm run clear-results                   # Clear legacy results.csv only

# Count test runs by type
wc -l results/results-warm.csv          # Count warm load tests
wc -l results/results-cold.csv          # Count cold load tests
wc -l results/results-all.csv           # Count all tests

# View only successful tests
grep -v "ERROR" results/results-warm.csv | tail -10    # Successful warm tests
grep -v "ERROR" results/results-cold.csv | tail -10    # Successful cold tests
```

### **Performance Monitoring**
```bash
# Monitor specific test performance over time (by cache type)
grep "Open SCORM" results/results-warm.csv | tail -5     # SCORM with cache
grep "Open SCORM" results/results-cold.csv | tail -5     # SCORM without cache
grep "Login Learner" results/results-warm.csv | tail -5   # Login with cache
grep "Login Learner" results/results-cold.csv | tail -5   # Login without cache

# Find fastest/slowest runs (by cache type)
grep -v "ERROR" results/results-warm.csv | sort -k3 -n | head -5    # Fastest warm
grep -v "ERROR" results/results-cold.csv | sort -k3 -n | head -5    # Fastest cold
grep -v "ERROR" results/results-warm.csv | sort -k3 -nr | head -5   # Slowest warm
grep -v "ERROR" results/results-cold.csv | sort -k3 -nr | head -5   # Slowest cold

# All results with cache status
grep "Login Learner" results/results-all.csv | tail -10             # Mixed cache status
```

### **Cache vs No-Cache Performance Analysis**
```bash
# Direct performance comparison for specific tests
echo "=== Login Learner Performance Comparison ==="
echo "WARM (with cache):"
grep "Login Learner" results/results-warm.csv | tail -5 | awk -F',' '{print $3 "s"}'
echo "COLD (without cache):"
grep "Login Learner" results/results-cold.csv | tail -5 | awk -F',' '{print $3 "s"}'

# Average performance by cache type (requires basic calculation)
echo "=== Average Open SCORM Performance ==="
echo "WARM: $(grep -v "ERROR" results/results-warm.csv | grep "Open SCORM" | awk -F',' '{sum+=$3; count++} END {print sum/count "s average"}')"
echo "COLD: $(grep -v "ERROR" results/results-cold.csv | grep "Open SCORM" | awk -F',' '{sum+=$3; count++} END {print sum/count "s average"}')"

# Side-by-side comparison script
cat << 'EOF' > compare-performance.sh
#!/bin/bash
TEST_NAME="$1"
echo "=== Performance Comparison: $TEST_NAME ==="
echo "WARM (cached) - Last 5 runs:"
grep "$TEST_NAME" results/results-warm.csv | grep -v "ERROR" | tail -5 | awk -F',' '{printf "  %s: %ss\n", $1, $3}'
echo "COLD (no cache) - Last 5 runs:"
grep "$TEST_NAME" results/results-cold.csv | grep -v "ERROR" | tail -5 | awk -F',' '{printf "  %s: %ss\n", $1, $3}'
EOF
chmod +x compare-performance.sh

# Usage: ./compare-performance.sh "Login Learner"
```

## Project Structure

```
src/
├── app.js                          # Main test runner with all 13 tests
├── show-accounts.js                # Display account assignments
├── utils/
│   ├── accounts.js                # Account management (21 unique accounts)
│   ├── config.js                  # Environment configuration & URL builders
│   ├── debug-helpers.js           # Visual testing helpers
│   ├── driver.js                  # Chrome WebDriver setup
│   ├── log.js                     # Results logging to CSV
│   └── login.js                   # Shared login utilities
└── workflows/
	├── loginLearner.js            # Learner login test (~3-6s)
	├── loginEducator.js           # Educator login test (~3s)
	├── loginCurator.js            # Curator login test (~3s)
	├── communicator.js            # Communication tests (learner/educator)
	├── openScorm.js               # SCORM content loading (~2-8s)
	├── openVideoProbe.js          # Video content loading (~1-5s)
	├── openCourseCatalog.js       # Course catalog navigation (~1s)
	├── openUniqueUsersReport.js   # Curator analytics: unique users (~0.1-5s)
	├── OpenProjectTeam.js         # Curator analytics: project teams (~0.3-5s)
	├── openClass.js               # Educator class dashboard (~0.9-8s)
	├── createClass.js             # Class creation workflow (~0.8-2.5s)
	└── openReview.js              # Review functionality test (~4s)
```

### **Configuration Files**
```
├── .env                           # Environment variables (not in repo)
├── .env.example                   # Environment template
├── package.json                   # Dependencies & npm scripts
├── results.csv                    # Legacy test results (backward compatibility)
├── results/                       # Performance results directory
│   ├── results-all.csv           # All results with cache status
│   ├── results-warm.csv          # Warm load results (with cache)
│   └── results-cold.csv          # Cold load results (without cache)
└── test-specifications.md         # Original test requirements
```

## Deployment

### Prerequisites
- Node.js 16+
- Chrome browser
- Valid test account credentials

### Production Setup
```bash
git clone <repository>
cd area9-performance-tests
npm install
cp .env.example .env
# Edit .env with production credentials
npm run working
```

### **Automated Testing & CI/CD**
```bash
# Schedule regular monitoring (example crontab)
# Run priority tests every 30 minutes
0,30 * * * * cd /path/to/tests && npm run priority

# Full test suite every 2 hours
0 */2 * * * cd /path/to/tests && npm run working

# Clear results weekly (every Monday)
0 0 * * 1 cd /path/to/tests && npm run clear-results

# Critical tests every 15 minutes during business hours
*/15 9-17 * * 1-5 cd /path/to/tests && npm run priority
```

### **CI/CD Integration Examples**
```yaml
# GitHub Actions example
- name: Run Area9 Performance Tests
	run: |
		npm install
		cp .env.example .env
		echo "DEFAULT_PASSWORD=${{ secrets.TEST_PASSWORD }}" >> .env
		npm run working

# Jenkins pipeline example
stage('Performance Tests') {
	steps {
		sh 'npm run working'
		archiveArtifacts 'results.csv'
	}
}
```

## Test Framework Features

### **Robust Element Detection**
- ✅ **Multiple selectors**: Each test tries multiple XPath/CSS strategies
- ✅ **Retry logic**: Automatic retry with different selectors if first fails
- ✅ **Wait strategies**: Smart waiting for elements to be visible and enabled
- ✅ **Fallback detection**: URL changes, content loading, navigation confirmation

### **UI Interaction Handling**
- ✅ **Enhanced overlay dismissal**: Comprehensive handling of onboarding overlays ("GOT IT", "OK", "Close", "Skip")
- ✅ **JavaScript clicks**: Fallback clicks when normal clicks fail
- ✅ **Scroll into view**: Ensures elements are visible before interaction
- ✅ **Form validation**: Waits for buttons to become enabled
- ✅ **Session management**: Login Learner test includes overlay dismissal and automatic logout for clean sessions

### **Performance Measurement**
- ✅ **Precise timing**: Millisecond accuracy with proper start/stop points
- ✅ **Specification compliance**: Timing points match original test requirements
- ✅ **CSV logging**: Structured results with timestamps
- ✅ **Error tracking**: Distinguishes between timeouts and functional errors
- ✅ **Cache control**: Compare cold load vs warm load performance
- ✅ **Performance modes**: Test realistic first-visit vs returning-user scenarios

### **Visual Testing Support**
- ✅ **Browser visibility**: Watch tests run in real-time
- ✅ **Slow mode**: Pauses between actions for observation
- ✅ **Debug logging**: Detailed console output with selector attempts
- ✅ **State logging**: Current page information for debugging

## Security

- ✅ Never commit `.env` files to version control
- ✅ Use unique passwords for different environments
- ✅ Rotate test account passwords regularly
- ✅ Each test uses dedicated accounts (no conflicts)
- ✅ Complete session isolation between tests
- ✅ No credentials in source code (environment-based)

## Troubleshooting

### **Common Issues**
| Issue | Solution |
|-------|----------|
| "Configuration Error" | Check `.env` file exists with `DEFAULT_PASSWORD` |
| "Chrome driver failed" | Update Chrome browser or reinstall chromedriver |
| "Element not found" | Check if Area9 interface has changed |
| "Already logged in" | Session clearing working correctly - this is expected |
| Test timeouts | Increase `DEFAULT_TIMEOUT` in `.env` |

### **Test-Specific Issues**
| Test | Issue | Solution |
|------|-------|----------|
| SCORM | Red overlay appears | Normal - onboarding tutorial dismissed automatically |
| Video Probe | Button disabled | Script waits for button to become enabled |
| Unique Users/Project Team | Clicking wrong card | XPath selectors distinguish between similar cards |
| Create Class | SAVE button disabled | Script waits for form validation and button activation |
| Class Opening | Performance data not loading | Script waits for "learners' performance" content |

### **Debug Mode**
```bash
# Run with maximum visibility for debugging
node src/app.js single "test_name" --visible --slow

# Check account assignments
npm run show-accounts

# View detailed error logs
tail -f results.csv
```

### **Performance Issues**
If tests are running slower than expected:
1. Check network connection stability
2. Verify Area9 server status
3. Increase `DEFAULT_TIMEOUT` in `.env`
4. Run individual tests to isolate issues
5. Clear browser cache/data (restart helps)

## Performance Expectations

| Test Category | Expected Time | Actual Performance | Status |
|---------------|---------------|-------------------|---------|
| **Authentication** | 3-6 seconds | 3-6 seconds | ✅ Stable |
| **Communication** | 6-17 seconds | 6-17 seconds | ✅ Stable |
| **Content Navigation** | 1-8 seconds | 1-8 seconds | ✅ Fast |
| **Analytics/Reports** | 0.1-5 seconds | 0.1-5 seconds | ⚡ Excellent |
| **Class Management** | 0.8-8 seconds | 0.8-8 seconds | ✅ Efficient |

### **Individual Test Benchmarks**
| Test Name | Target | Current Avg | Best | Status |
|-----------|--------|-------------|------|--------|
| Login Learner | 8.4s | ~4s | 3.2s | ✅ Better than target |
| Login Educator | 14.5s | ~3s | 3.2s | ⚡ Much better |
| Login Curator | 12s | ~3s | 3.2s | ⚡ Much better |
| Open SCORM | 8s | ~2s | 1.95s | ⚡ Much better |
| Open Video Probe | 5s | ~2s | 1.48s | ⚡ Much better |
| Open Course Catalog | 1s | ~1s | 1.09s | ✅ On target |
| Open Class | 8s | ~1s | 0.94s | ⚡ Much better |
| Create Class | 2.5s | ~0.8s | 0.79s | ⚡ Much better |
| Unique Users Report | 5s | ~0.1s | 0.10s | ⚡ Excellent |
| Project Team Activity | 5s | ~0.5s | 0.30s | ⚡ Excellent |

**Note**: Times may vary based on network conditions, server load, and browser performance. The Area9 platform is performing excellently across all test categories.