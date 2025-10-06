#!/bin/bash
# Script to update all workflows to use unified auth module

echo "🔄 Updating workflows to use unified auth..."

# List of workflow files that need updating
WORKFLOWS=(
	"src/workflows/loginEducator.js"
	"src/workflows/loginLearner.js"
	"src/workflows/communicatorEducator.js"
	"src/workflows/communicatorLearner.js"
	"src/workflows/openScorm.js"
	"src/workflows/openVideoProbe.js"
	"src/workflows/openCourseCatalog.js"
	"src/workflows/openReview.js"
	"src/workflows/openClass.js"
	"src/workflows/deleteClass.js"
	"src/workflows/openUniqueUsersReport.js"
	"src/workflows/OpenProjectTeam.js"
	"src/workflows/pageLoad.js"
)

echo "📝 Files to update:"
for file in "${WORKFLOWS[@]}"; do
	echo "  - $file"
done

echo ""
echo "⚠️  This script will:"
echo "  1. Replace 'from \"../utils/logout.js\"' with 'from \"../utils/auth.js\"'"
echo "  2. Update import statements"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	echo "❌ Cancelled"
	exit 1
fi

# Update import statements
for file in "${WORKFLOWS[@]}"; do
	if [ -f "$file" ]; then
		echo "🔧 Updating $file..."

		# Replace logout.js import with auth.js
		sed -i '' 's/from "\.\.\/utils\/logout\.js"/from "..\/utils\/auth.js"/g' "$file"

		# Update performLogout import to include performLogin if needed
		# (Manual review recommended)

		echo "  ✅ Updated imports"
	else
		echo "  ⚠️  File not found: $file"
	fi
done

echo ""
echo "✅ Import updates complete!"
echo ""
echo "📋 Next steps (manual):"
echo "  1. Review each workflow file"
echo "  2. For non-login workflows: replace login code with performLogin()"
echo "  3. Ensure performLogout is called correctly"
echo "  4. Test each workflow"
echo ""
echo "Example changes:"
echo ""
echo "  BEFORE (in openReview.js):"
echo "    const emailField = await waitFor.element(...);"
echo "    await emailField.sendKeys(account);"
echo "    // ... rest of login code"
echo ""
echo "  AFTER:"
echo "    import { performLogin, performLogout } from \"../utils/auth.js\";"
echo "    await performLogin(driver, 'educator', account);"
