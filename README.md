# Area9 Performance Test Suite

Automated performance testing framework for the Area9 learning platform.

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
# Run 5 priority tests (core functionality)
npm run priority-watch

# Run all 7 working tests
npm run working-watch

# Run single test
node src/app.js single "login learner" --visible --slow
```

## Available Tests

### ✅ Working Tests (7)
- **Login Learner** (~6s) - Tests learner login flow
- **Login Educator** (~3s) - Tests educator login flow
- **Login Curator** (~3s) - Tests curator login flow
- **Communicator Learner** (~6s) - Tests learner communication interface
- **Communicator Educator** (~6s) - Tests educator communication interface
- **Open Course Catalog** (~11s) - Tests course catalog navigation
- **Open Review** (~4s) - Tests review functionality

### 🎯 Priority Tests (5)
Core login and communication functionality tests (excludes Course Catalog and Review)

## Commands

| Command | Description |
|---------|-------------|
| `npm run priority` | Run 5 priority tests (headless) |
| `npm run priority-watch` | Run priority tests (visible + slow) |
| `npm run working` | Run all 7 working tests (headless) |
| `npm run working-watch` | Run all working tests (visible + slow) |
| `npm run show-accounts` | Display account assignments |

### Advanced Usage
```bash
# Run specific test types
node src/app.js single "login" --visible          # Any login test
node src/app.js single "communicator" --visible   # Any communicator test
node src/app.js single "open" --visible           # Any "open" functionality

# Different modes
node src/app.js working                           # Headless mode (faster)
node src/app.js working --visible                 # Watch browser
node src/app.js working --visible --slow          # Watch + pauses
```

## Configuration

### Environment Variables (.env)
- `DEFAULT_PASSWORD` - Password for all test accounts (**required**)
- `BASE_URL` - Base URL for tests (optional, defaults to UAT)
- `SKIN_PARAM` - Skin parameter (optional, has default)
- `DEFAULT_TIMEOUT` - Element wait timeout in ms (optional, default 20000)

### Test Accounts
Each test uses a unique account to prevent conflicts and enable parallel testing:
- **Learner accounts**: A9-106821@area9.dk to A9-106830@area9.dk (10 accounts)
- **Educator accounts**: A9-106816@area9.dk to A9-106820@area9.dk (5 accounts)
- **Curator accounts**: A9-106810@area9.dk to A9-106815@area9.dk (6 accounts)

## Results & Monitoring

Test results are automatically logged to `results.csv` with:
- Timestamp
- Test name
- Execution time (seconds) or "ERROR"

View recent results:
```bash
tail -10 results.csv
```

## Project Structure

```
src/
├── app.js                    # Main test runner
├── show-accounts.js          # Display account assignments
├── utils/
│   ├── accounts.js          # Account management and assignments
│   ├── config.js            # Environment configuration
│   ├── debug-helpers.js     # Visual testing helpers
│   ├── driver.js           # Chrome WebDriver setup
│   ├── log.js              # Results logging
│   └── login.js            # Shared login utilities
└── workflows/
	├── loginLearner.js     # Learner login test
	├── loginEducator.js    # Educator login test
	├── loginCurator.js     # Curator login test
	├── communicator.js     # Communication tests
	├── openCourseCatalog.js # Course catalog test
	└── openReview.js       # Review functionality test
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

### Automated Testing
```bash
# Schedule regular tests (example crontab)
# Run working tests every hour: 0 * * * * cd /path/to/tests && npm run working
# Run priority tests every 30 min: 0,30 * * * * cd /path/to/tests && npm run priority
```

## Security

- ✅ Never commit `.env` files to version control
- ✅ Use unique passwords for different environments
- ✅ Rotate test account passwords regularly
- ✅ Each test uses dedicated accounts (no conflicts)
- ✅ Session isolation between tests

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Configuration Error" | Check `.env` file exists with `DEFAULT_PASSWORD` |
| "Chrome driver failed" | Update Chrome browser or reinstall chromedriver |
| "Element not found" | Check if Area9 interface has changed |
| "Already logged in" | Session clearing working correctly - this is expected |
| Test timeouts | Increase `DEFAULT_TIMEOUT` in `.env` |

## Performance Expectations

| Test Category | Expected Time | Status |
|---------------|---------------|---------|
| Login tests | 3-6 seconds | ✅ Stable |
| Communication | 6-7 seconds | ✅ Stable |
| Navigation | 4-11 seconds | ✅ Variable |

Times may vary based on network conditions and server load.