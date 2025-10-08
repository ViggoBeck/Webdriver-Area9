# Quick Start Guide - Test Suite

## Running Tests

```bash
npm start
```

## Adjusting Log Verbosity

Edit the `.env` file and change the `LOG_LEVEL` setting:

### For Clean Output (Recommended) ✨
```env
LOG_LEVEL=info
```
**Best for:** Daily development, monitoring test results

**Output:** Key milestones and results only
```
✅ Dashboard loaded
⏱ COLD login took: 15.438s
📊 Results: Cold: 6.596s, Warm: 4.758s (27.9% improvement)
```

### For Troubleshooting 🔍
```env
LOG_LEVEL=debug
```
**Best for:** When tests fail and you need more detail

**Output:** Detailed execution flow with all major steps

### For Deep Debugging 🐛
```env
LOG_LEVEL=verbose
```
**Best for:** Understanding exact timing and escalation behavior

**Output:** Everything including timeout escalations and network requests

### For CI/CD Pipelines 🤖
```env
LOG_LEVEL=silent
```
**Best for:** Automated runs where you only need results

**Output:** Only test results and errors

## Common Issues & Solutions

### Issue: "element click intercepted"
**Status:** ✅ FIXED
**What was done:** Aggressive overlay removal and JavaScript click fallback

### Issue: Course Catalog menu won't open
**Status:** ✅ FIXED
**What was done:** Improved retry logic with forced element visibility

### Issue: Too much logging
**Status:** ✅ FIXED
**Solution:** Set `LOG_LEVEL=info` in `.env` (default)

## Log Level Cheat Sheet

| Level | What You See |
|-------|-------------|
| `silent` | Results only |
| `error` | Errors only |
| `warn` | Errors + Warnings |
| **`info`** | **Key events (default)** ⭐ |
| `debug` | Detailed steps |
| `verbose` | Everything |

## Tips

1. **Start with `info`** - It's the sweet spot for most use cases
2. **Switch to `debug` when troubleshooting** - Gives you detail without overwhelming
3. **Use `verbose` only when you need timing details** - Shows all timeout escalations
4. **Set to `silent` for reports** - Clean output for CI/CD

## Test Results Location

Results are automatically saved to:
- `results/results-normal.csv` - Normal workflow tests
- `results/results-cold.csv` - Cold cache tests
- `results/results-warm.csv` - Warm cache tests
- `results/results-cache-comparison.csv` - Cache comparison analysis

## Need Help?

Check `IMPROVEMENTS_SUMMARY.md` for detailed information about all changes.
