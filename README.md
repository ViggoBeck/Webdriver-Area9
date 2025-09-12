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

# Run all 6 working tests
npm run working-watch

# Run single test
node src/app.js single "login learner" --visible --slow
```

## Available Tests

### ✅ Working Tests (6)
- **Login Learner** (~6s)
- **Login Educator** (~3-8s)
- **Login Curator** (~3-9s)
- **Communicator Learner** (~9-10s)
- **Communicator Educator** (~6s)
- **Open Review** (~4s)

## Commands

| Command | Description |
|---------|-------------|
| `npm run priority` | Run 5 priority tests (headless) |
| `npm run priority-watch` | Run priority tests (visible + slow) |
| `npm run working` | Run all 6 working tests (headless) |
| `npm run working-watch` | Run all working tests (visible + slow) |
| `npm run show-accounts` | Display account assignments |

## Configuration

### Environment Variables (.env)
- `DEFAULT_PASSWORD` - Password for all test accounts (required)
- `BASE_URL` - Base URL for tests (optional, defaults to UAT)
- `SKIN_PARAM` - Skin parameter (optional, has default)
- `DEFAULT_TIMEOUT` - Element wait timeout in ms (optional, default 20000)

### Test Accounts
Each test uses a unique account to prevent conflicts:
- **Learner accounts**: A9-106821@area9.dk to A9-106830@area9.dk
- **Educator accounts**: A9-106816@area9.dk to A9-106820@area9.dk
- **Curator accounts**: A9-106810@area9.dk to A9-106815@area9.dk

## Results

Test results are logged to `results.csv` with timestamps and execution times.

## Security

- Never commit `.env` files to version control
- Keep passwords secure and rotate regularly
- Use different passwords for different environments