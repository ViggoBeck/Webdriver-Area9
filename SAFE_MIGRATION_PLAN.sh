#!/bin/bash
# Safe migration plan - updates imports, tests, then cleans up

set -e  # Exit on any error

echo "🔄 Safe Migration to Unified Auth Module"
echo "========================================"
echo ""

# Step 1: Show current state
echo "📊 Current State:"
echo ""
echo "Files importing logout.js:"
grep -r 'from.*logout\.js' src/workflows/ src/workflowsCache/ --include="*.js" | cut -d: -f1 | sort -u
echo ""
echo "Files importing learner-utils.js:"
grep -r 'from.*learner-utils\.js' src/workflows/ src/workflowsCache/ --include="*.js" | cut -d: -f1 | sort -u
echo ""

read -p "Press Enter to update imports..."

# Step 2: Update imports
echo ""
echo "🔧 Step 1: Updating imports..."
./quick-fix-imports.sh

# Step 3: Verify changes
echo ""
echo "📝 Step 2: Verifying changes..."
echo ""
echo "Files still importing old modules:"
OLD_IMPORTS=$(grep -r 'from.*\(logout\|learner-utils\)\.js' src/workflows/ src/workflowsCache/ --include="*.js" 2>/dev/null | wc -l)
if [ "$OLD_IMPORTS" -eq 0 ]; then
  echo "  ✅ No files importing old modules!"
else
  echo "  ⚠️  $OLD_IMPORTS files still have old imports"
  grep -r 'from.*\(logout\|learner-utils\)\.js' src/workflows/ src/workflowsCache/ --include="*.js"
  echo ""
  echo "❌ Stopping - manual fixes needed"
  exit 1
fi

# Step 4: Test
echo ""
echo "🧪 Step 3: Testing workflows..."
echo ""
echo "Testing loginCurator..."
node src/app.js single "login curator" || { echo "❌ Test failed!"; exit 1; }
echo ""
echo "Testing createClass..."
node src/app.js single "create class" || { echo "❌ Test failed!"; exit 1; }

# Step 5: Delete old files
echo ""
echo "🗑️  Step 4: Ready to delete old files"
echo ""
echo "Old files to delete:"
echo "  - src/utils/logout.js"
echo "  - src/utils/learner-utils.js"
echo ""
read -p "Delete old files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm src/utils/logout.js
  rm src/utils/learner-utils.js
  echo "✅ Old files deleted!"
else
  echo "⚠️  Old files kept for now"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next: Test full suite with 'npm run workflows'"
