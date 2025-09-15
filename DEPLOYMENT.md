# Deployment Checklist

## Pre-Deployment

### ✅ Environment Setup
- [ ] Node.js 16+ installed
- [ ] Chrome browser installed and updated
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install`)

### ✅ Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `DEFAULT_PASSWORD` set in `.env`
- [ ] Test account credentials verified
- [ ] Network access to `br.uat.sg.rhapsode.com` confirmed

### ✅ Verification Tests
- [ ] Run `npm run priority` to verify core functionality
- [ ] Run `npm run working` to verify all tests
- [ ] Check `results.csv` for successful execution
- [ ] Verify account assignments with `npm run show-accounts`

## Deployment Steps

### 1. Clone and Setup
```bash
git clone <repository-url>
cd area9-performance-tests
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with actual credentials
nano .env
```

### 3. Test Installation
```bash
# Quick smoke test
npm run priority

# Full functionality test
npm run working
```

### 4. Production Configuration
- Set up automated scheduling (cron jobs)
- Configure result monitoring/alerting
- Set up log rotation for `results.csv`

## Monitoring & Maintenance

### Regular Checks
- [ ] Monitor `results.csv` for failures
- [ ] Check Chrome browser updates
- [ ] Verify test account access
- [ ] Review performance trends

### Monthly Maintenance
- [ ] Update dependencies (`npm audit`)
- [ ] Rotate test account passwords
- [ ] Archive old `results.csv` data
- [ ] Review and update test expectations

### Troubleshooting Common Issues
- **Chrome driver failures**: Update chromedriver or Chrome
- **Login timeouts**: Check network connectivity and account status
- **Element not found**: Verify Area9 interface hasn't changed
- **Session conflicts**: Account management system should prevent this

## Production Environment Variables

### Required
```bash
DEFAULT_PASSWORD=<secure_password>
```

### Optional (with defaults)
```bash
BASE_URL=https://br.uat.sg.rhapsode.com
SKIN_PARAM=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc
DEFAULT_TIMEOUT=20000
```

## Automated Scheduling Examples

### Crontab Examples
```bash
# Run priority tests every 30 minutes
0,30 * * * * cd /path/to/tests && npm run priority >> /var/log/area9-tests.log 2>&1

# Run full working tests every 2 hours
0 */2 * * * cd /path/to/tests && npm run working >> /var/log/area9-tests.log 2>&1

# Generate daily report at 6 AM
0 6 * * * cd /path/to/tests && echo "Daily Report $(date)" >> daily-report.log && tail -48 results.csv >> daily-report.log
```

### Systemd Service (Optional)
Create `/etc/systemd/system/area9-tests.service`:
```ini
[Unit]
Description=Area9 Performance Tests
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/area9-performance-tests
ExecStart=/usr/bin/npm run working
User=testuser
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Security Checklist

### ✅ Credentials
- [ ] Test passwords are unique and secure
- [ ] `.env` file permissions are 600 (owner read/write only)
- [ ] Production credentials differ from development
- [ ] Regular password rotation schedule established

### ✅ Access Control
- [ ] Test accounts have minimal required permissions
- [ ] Separate accounts for different environments
- [ ] No shared credentials between team members

### ✅ Data Protection
- [ ] No sensitive data in git repository
- [ ] Results data contains no personal information
- [ ] Log files are properly secured and rotated

## Support Contacts

- **Technical Issues**: Development Team
- **Account Management**: Area9 Admin
- **Infrastructure**: DevOps Team
- **Test Results**: QA Team