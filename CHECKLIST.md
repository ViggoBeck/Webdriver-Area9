# Testing Checklist

## Phase 1: Verification ✅

### Priority Tests
- [ ] **Course Catalog Cache** - Was failing, now fixed
	```bash
	node src/app.js single "course catalog cache" --visible
	```
	- [ ] Menu opens successfully
	- [ ] Course Catalog loads
	- [ ] Both cold and warm tests complete
	- [ ] No click interception errors

- [ ] **SCORM Cache** - Click interception was failing
	```bash
	node src/app.js single "scorm cache" --visible
	```
	- [ ] Card is clickable
	- [ ] Content loads
	- [ ] Both cold and warm tests complete

- [ ] **Video Probe Cache** - Click interception was failing
	```bash
	node src/app.js single "video probe cache" --visible
	```
	- [ ] Card is clickable
	- [ ] Content loads
	- [ ] Both cold and warm tests complete

### Full Test Suites
- [ ] **All Cache Tests** (9 tests)
	```bash
	npm run cache-visible
	```
	- [ ] All 9 tests pass
	- [ ] CSV files populated
	- [ ] No errors in output

- [ ] **All Normal Workflows** (16 tests)
	```bash
	npm start
	```
	- [ ] All 16 tests pass
	- [ ] Reasonable execution times
	- [ ] CSV files populated

### Log Level Verification
Test with `node src/app.js single "login learner"`:

- [ ] **silent** - Only results, no progress
- [ ] **error** - Only errors shown
- [ ] **warn** - Errors + warnings
- [ ] **info** - Key events (default) ⭐
- [ ] **debug** - Detailed steps
- [ ] **verbose** - Everything including escalations

### Output Quality Check
- [ ] Clean and readable at `info` level
- [ ] No duplicate messages
- [ ] Timing results visible
- [ ] Test completion status clear
- [ ] Error messages are helpful
- [ ] No excessive blank lines

---

## Phase 2: Fine-Tuning (If Needed) 🔧

### Log Level Adjustments
- [ ] Review which messages are at each level
- [ ] Move noisy debug messages to verbose
- [ ] Ensure critical info is at info level
- [ ] Test changes with real workflow runs

### Performance Review
- [ ] Measure average test execution times
- [ ] Identify slow tests
- [ ] Check timeout values
- [ ] Optimize if needed

### Error Message Improvements
- [ ] Add more context to errors
- [ ] Include current URL in failures
- [ ] Show attempted selectors
- [ ] Suggest fixes where possible

---

## Phase 3: Documentation 📚

### Documentation Tasks
- [ ] Add performance benchmarks
- [ ] Create troubleshooting guide
- [ ] Add more usage examples
- [ ] Document common patterns

### Testing Documentation
- [ ] Verify all commands work
- [ ] Test examples in docs
- [ ] Check for outdated info
- [ ] Update screenshots if any

---

## Issue Tracking

### Found Issues
Record any issues found during testing:

**Issue 1:**
- Test: _____
- Problem: _____
- Error: _____
- Resolution: _____

**Issue 2:**
- Test: _____
- Problem: _____
- Error: _____
- Resolution: _____

---

## Success Metrics

### Must Pass:
- ✅ Course Catalog Cache works
- ✅ SCORM Cache works
- ✅ Video Probe Cache works
- ✅ All cache tests pass (9/9)
- ✅ All normal workflows pass (16/16)

### Quality Metrics:
- ✅ Log output is clean
- ✅ No click interception errors
- ✅ Tests complete in reasonable time
- ✅ Error messages are helpful
- ✅ Documentation is accurate

---

## Quick Commands Reference

```bash
# Start fresh
npm run clear-results

# Test specific issues
node src/app.js single "course catalog cache" --visible
node src/app.js single "scorm cache" --visible
node src/app.js single "video probe cache" --visible

# Run suites
npm run cache-visible    # All cache tests
npm start               # All normal workflows

# Change log level (in .env)
LOG_LEVEL=info    # Default
LOG_LEVEL=debug   # More detail
LOG_LEVEL=verbose # Everything

# View results
cat results/results-cache-comparison.csv
```

---

## Notes

_Use this section to record observations during testing_

**Testing Session:** ___________

**Log Level Used:** ___________

**Observations:**
-
-
-

**Issues Found:**
-
-
-

**Next Actions:**
-
-
-
