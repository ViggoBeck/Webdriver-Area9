# Area9 Performance Test Suite

Automated performance testing for Area9 Rhapsode™ learning platform with precise timing measurements and robust error handling.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set: DEFAULT_PASSWORD=your_password

# 3. Run tests
npm start              # Run all normal workflows
npm run cache          # Run cache comparison tests
```

## 📋 Available Tests

### Normal Workflows (15 tests)

```bash
npm start                     # Run all (headless)
npm run workflows-visible     # Run with browser visible
```

**Login Tests (3):**
- Login Learner
- Login Educator
- Login Curator

**Communicator (2):**
- Communicator Learner
- Communicator Educator

**Content Navigation (5):**
- Open SCORM
- Open Video Probe
- Open Course Catalog
- Open Review
- Page Load

**Analytics (2):**
- Open Unique Users Report (Curator)
- Open Project Team Activity (Curator)

**Class Management (3):**
- Open Class
- Create Class
- Delete Class

### Cache Comparison Tests (9 tests)

Measures cold vs warm cache performance:

```bash
npm run cache                 # Run all cache tests (headless)
npm run cache-visible         # Run with browser visible
```

## 🎯 Running Specific Tests

```bash
# Run a single test
node src/app.js single "login learner"
node src/app.js single "open course catalog"

# Run with browser visible for debugging
node src/app.js single "login learner" --visible
```

## 📊 Results

Results are automatically saved to CSV files in the `results/` folder:

```
results/
├── results-normal.csv              # Normal workflow timings
├── results-cold.csv                # First run (cold cache)
├── results-warm.csv                # Second run (warm cache)
└── results-cache-comparison.csv    # Cold vs warm analysis
```

Clear previous results:
```bash
npm run clear-results
```

## 🔧 Configuration

Edit `.env` to customize behavior:

```env
# Required
DEFAULT_PASSWORD=your_password

# Optional
LOG_LEVEL=info     # silent|error|warn|info|debug|verbose
```

### Log Levels

| Level | What You See | When to Use |
|-------|-------------|-------------|
| **`info`** | **Key events only (default)** ⭐ | **Normal usage** |
| `debug` | Detailed step-by-step | Troubleshooting failures |
| `verbose` | Everything + network activity | Deep debugging |
| `silent` | Minimal output | CI/CD or when generating reports |

## 👥 Test Accounts

Each test uses a dedicated account from a pool to avoid conflicts. The mapping is defined in `src/utils/accounts.js`:

**View current account assignments:**
```bash
npm run show-accounts
```

**Account pools:**
- **Learner**: A9-106821@area9.dk to A9-106830@area9.dk (10 accounts)
- **Educator**: A9-106816@area9.dk to A9-106820@area9.dk (5 accounts)
- **Curator**: A9-106810@area9.dk to A9-106815@area9.dk (6 accounts)

## 🆘 Troubleshooting

### ⚠️ "User Already Logged In" Error

If a test fails because the user is already logged in to the platform:

1. **Find the account** - Check which account the test was trying to use:
	 - Look at the error message for the account email
	 - Or check `src/utils/accounts.js` to see the account mapping for that test

2. **Manually logout** - Open a browser and:
	 - Navigate to the Area9 UAT environment
	 - Login with that specific account (password in `.env`)
	 - Click the menu and logout properly

3. **Restart the test** - Run the test again:
	 ```bash
	 node src/app.js single "test name"
	 ```

**Example:**
```
Error: Login Learner failed - user already logged in
Account used: A9-106821@area9.dk

Solution:
1. Open browser → Login as A9-106821@area9.dk
2. Click menu → Logout
3. Run: node src/app.js single "login learner"
```

### Tests Failing with Click Errors

The suite handles most click issues automatically with:
- Overlay dismissal
- JavaScript click fallback
- Element visibility forcing
- Progressive retry logic

If you still see errors, try running with visible mode to see what's happening:
```bash
node src/app.js single "test name" --visible
```

### Need More Details for Debugging

Increase log level temporarily:
```bash
# In .env
LOG_LEVEL=debug

# Run the failing test
node src/app.js single "test name" --visible
```

### Configuration Error on Startup

Make sure your `.env` file exists and has `DEFAULT_PASSWORD` set:
```bash
# Check if .env exists
cat .env

# If not, create it
cp .env.example .env
# Then edit and set DEFAULT_PASSWORD
```

## 📁 Project Structure

```
VSC_A9/WD/
├── src/
│   ├── workflows/          # Normal workflow tests
│   ├── workflowsCache/     # Cache comparison tests
│   ├── utils/
│   │   ├── accounts.js     # 👈 Test account mappings
│   │   ├── logger.js       # Logging system
│   │   ├── driver.js       # WebDriver utilities
│   │   └── auth.js         # Login/logout helpers
│   └── app.js              # Main test runner
├── results/                # Test results (CSV files)
├── .env                    # Configuration (you create this)
└── package.json            # Dependencies
```

## 🎯 Timing Specifications

All workflows measure precise timings:

- **Login workflows**: Timer starts at login button click, stops when dashboard is fully interactive
- **Navigation workflows**: Timer starts at navigation action (click tab/card), stops when content is visible
- **Class operations**: Timer starts at action confirmation, stops when operation completes

## 🎓 For Developers

### Running in Development

```bash
# Run all tests with visible browser for observation
npm run workflows-visible

# Run specific test with debugging output
LOG_LEVEL=debug node src/app.js single "test name" --visible
```


