#!/bin/bash
# Quick script to update all imports from logout.js and learner-utils.js to auth.js

echo "🔄 Quick Fix: Updating all imports to use auth.js..."
echo ""

# Update logout.js imports
echo "📝 Updating logout.js imports..."
find src/workflows src/workflowsCache -name "*.js" -type f -exec sed -i '' 's/from "\.\.\/utils\/logout\.js"/from "..\/utils\/auth.js"/g' {} \;
echo "  ✅ Updated logout.js imports"

# Update learner-utils.js imports
echo "📝 Updating learner-utils.js imports..."
find src/workflows src/workflowsCache -name "*.js" -type f -exec sed -i '' 's/from "\.\.\/utils\/learner-utils\.js"/from "..\/utils\/auth.js"/g' {} \;
echo "  ✅ Updated learner-utils.js imports"

# Update function names
echo "📝 Updating function calls..."

# dismissLearnerOverlay → dismissOverlays
find src/workflows src/workflowsCache -name "*.js" -type f -exec sed -i '' 's/dismissLearnerOverlay/dismissOverlays/g' {} \;
echo "  ✅ Updated dismissLearnerOverlay → dismissOverlays"

# performLearnerLogout(driver) → performLogout(driver, 'learner')
find src/workflows src/workflowsCache -name "*.js" -type f -exec sed -i '' "s/await performLearnerLogout(driver);/await performLogout(driver, 'learner');/g" {} \;
echo "  ✅ Updated performLearnerLogout → performLogout with role"

echo ""
echo "✅ Import and function call updates complete!"
echo ""
echo "⚠️  IMPORTANT: You still need to manually:"
echo "  1. Review changes with: git diff src/"
echo "  2. Test workflows: node src/app.js single 'login curator'"
echo "  3. Update login code blocks in non-login workflows"
echo "  4. Delete old files after testing: rm src/utils/logout.js src/utils/learner-utils.js"
echo ""
