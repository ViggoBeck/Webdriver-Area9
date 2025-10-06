#!/bin/bash
# Delete old utility files and see what breaks

echo "⚠️  This will DELETE old utility files!"
echo ""
echo "Files to delete:"
echo "  - src/utils/logout.js (287 lines)"
echo "  - src/utils/learner-utils.js (142 lines)"
echo ""
echo "Files that will break:"
grep -r 'from.*logout\.js' src/ --include="*.js" | grep -v "^Binary"
echo ""
grep -r 'from.*learner-utils\.js' src/ --include="*.js" | grep -v "^Binary"
echo ""
read -p "Continue with deletion? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo "🗑️  Deleting old files..."
rm src/utils/logout.js
rm src/utils/learner-utils.js
echo "✅ Deleted!"
echo ""
echo "Now you MUST update imports or workflows will fail."
echo "Run: ./quick-fix-imports.sh"
