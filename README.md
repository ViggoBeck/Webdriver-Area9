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

# Run all 14 tests (watch mode)
npm run working-watch

# Run cache comparison tests (visible)
node src/app.js cache --visible --slow

# Run specific test
node src/app.js single "login learner" --visible --slow
```

## Available Tests (14 total)

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

### Cache Tests (7 total)
Tests that run the same action twice to measure caching benefits:

```bash
# Run cache comparison tests
node src/app.js cache --visible --slow

# Available cache tests:
# - SCORM Cache (cold vs warm)
# - Video Probe Cache (cold vs warm)
# - Review Cache (cold vs warm)
# - Course Catalog Cache (cold vs warm)
# - Create Class Cache (cold vs warm)
# - Open Class Cache (cold vs warm)
# - Delete Class Cache (cold vs warm)
```

## Simple Commands

| Command | What it does |
|---------|-------------|
| `npm run priority-watch` | Run 6 core tests (visible) |
| `npm run working-watch` | Run all 14 tests (visible) |
| `node src/app.js cache -v -s` | Run 7 cache comparison tests (visible) |
| `npm run create` | Create test class (visible) |
| `npm run delete` | Delete test class (visible) |
| `npm run show-accounts` | Show which account each test uses |

## Configuration

Only one setting needed in `.env` file:
```
DEFAULT_PASSWORD=your_actual_password
```

## Results

Test results are automatically saved to `results.csv` with timing data.

## Troubleshooting

**"Configuration Error"** → Check `.env` file has `DEFAULT_PASSWORD`

**Test fails** → Try running with `--visible --slow` to see what happens:
```bash
node src/app.js single "test name" --visible --slow
```

**Browser issues** → Update Chrome or restart terminal

## Test Accounts

Each test uses a unique account (no conflicts):
- Learner accounts: A9-106821@area9.dk to A9-106830@area9.dk
- Educator accounts: A9-106816@area9.dk to A9-106820@area9.dk
- Curator accounts: A9-106810@area9.dk to A9-106815@area9.dk

Run `npm run show-accounts` to see exact assignments.