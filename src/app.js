import { createDriver } from "./utils/driver.js";
import { loginLearner } from "./workflows/loginLearner.js";
import { loginEducator } from "./workflows/loginEducator.js";
import { loginCurator } from "./workflows/loginCurator.js";
import { communicatorLearner, communicatorEducator } from "./workflows/communicator.js";
import { openReview } from "./workflows/openReview.js";
import { openScorm } from "./workflows/openScorm.js";
import { openVideoProbe } from "./workflows/openVideoProbe.js";
import { openCourseCatalog } from "./workflows/openCourseCatalog.js";
import { analyticsEducator } from "./workflows/analyticsEducator.js";
import { analyticsCuratorUniqueUsers, analyticsCuratorProjectTeam } from "./workflows/analyticsCurator.js";
import { openClass } from "./workflows/openClass.js";
import { createClass } from "./workflows/createClass.js";
import { deleteClass } from "./workflows/deleteClass.js";
import { logResult } from "./utils/log.js";
import { getAccountForTest } from "./utils/accounts.js";

// Clear browser session between tests to ensure clean login state
async function clearSession(driver) {
	try {
		console.log("🧹 Clearing session between tests...");

		// Clear all cookies, local storage, and session storage
		await driver.manage().deleteAllCookies();

		// Clear local and session storage via JavaScript
		await driver.executeScript("window.localStorage.clear();");
		await driver.executeScript("window.sessionStorage.clear();");

		console.log("✅ Session cleared successfully");
	} catch (error) {
		console.log("⚠️ Error clearing session:", error.message);
		// Continue anyway - not fatal
	}
}

// Priority tests marked with (*) in specifications
const PRIORITY_TESTS = [
	{ name: "Login Learner", func: loginLearner },
	{ name: "Login Educator", func: loginEducator },
	{ name: "Login Curator", func: loginCurator },
	{ name: "Communicator Learner", func: communicatorLearner },
	{ name: "Communicator Educator", func: communicatorEducator },
	{ name: "Open Course Catalog", func: openCourseCatalog }
];

// All available tests
const IMPLEMENTED_TESTS = [
	...PRIORITY_TESTS,
	{ name: "Open Review", func: openReview },
	{ name: "Open SCORM", func: openScorm }
];

const NOT_YET_IMPLEMENTED = [
	{ name: "Open Video Probe", func: openVideoProbe },
	{ name: "Analytics Educator", func: analyticsEducator },
	{ name: "Analytics Curator - Unique Users", func: analyticsCuratorUniqueUsers },
	{ name: "Analytics Curator - Project Team", func: analyticsCuratorProjectTeam },
	{ name: "Open Class", func: openClass },
	{ name: "Create Class", func: createClass },
	{ name: "Delete Class", func: deleteClass }
];

const ALL_TESTS = [...IMPLEMENTED_TESTS, ...NOT_YET_IMPLEMENTED];

async function runTests(testSuite, suiteName, options = {}) {
	console.log(`\n🚀 Starting ${suiteName}...`);

	if (options.visible) {
		console.log("👁️ Visual mode enabled - you can watch the browser");
	}
	if (options.slowMode) {
		console.log("🐌 Slow mode enabled - pauses between actions");
	}

	const driver = await createDriver(options.visible, options.slowMode);

	try {
		for (const test of testSuite) {
		  const assignedAccount = getAccountForTest(test.name);
		  console.log(`\n⏳ Running: ${test.name}`);
		  console.log(`👤 Using account: ${assignedAccount}`);
			try {
				const time = await test.func(driver);
				logResult(test.name, time);
				console.log(`✅ ${test.name} completed: ${time.toFixed(2)}s`);

				if (options.slowMode) {
					console.log("🐌 Slow mode: Pausing 5 seconds to observe results...");
					await new Promise(resolve => setTimeout(resolve, 5000));
				}

				// Clear session between tests to ensure clean state
				await clearSession(driver);

				// Short pause between tests to avoid overwhelming the server
				await new Promise(resolve => setTimeout(resolve, 2000));
			} catch (testErr) {
				console.error(`❌ Error in ${test.name}:`, testErr.message);
				logResult(test.name, "ERROR");

				if (options.slowMode) {
					console.log("🐌 Slow mode: Pausing 3 seconds after error...");
					await new Promise(resolve => setTimeout(resolve, 3000));
				}

				// Still clear session after errors to ensure clean state for next test
				await clearSession(driver);
			}
		}
	} catch (err) {
		console.error("❌ General error during tests:", err);
	} finally {
		await driver.quit();
		console.log(`\n✨ ${suiteName} completed\n`);
	}
}

async function runPriorityTests(options = {}) {
	await runTests(PRIORITY_TESTS, "Priority Tests", options);
}

async function runImplementedTests(options = {}) {
	await runTests(IMPLEMENTED_TESTS, "Implemented Tests", options);
}

async function runAllTests(options = {}) {
	await runTests(ALL_TESTS, "All Tests", options);
}

// Check command line arguments to determine which tests to run
const args = process.argv.slice(2);
const command = args[0];

// Parse options
const options = {
	visible: args.includes('--visible') || args.includes('-v'),
	slowMode: args.includes('--slow') || args.includes('-s')
};

switch (command) {
	case "priority":
		runPriorityTests(options);
		break;
	case "implemented":
		runImplementedTests(options);
		break;
	case "all":
		runAllTests(options);
		break;
	case "single":
		// Run a single test by name
		const testName = args[1];
		const test = ALL_TESTS.find(t => t.name.toLowerCase().includes(testName?.toLowerCase()));
		if (test) {
			runTests([test], `Single Test: ${test.name}`, options);
		} else {
			console.log("❌ Test not found. Available tests:");
			ALL_TESTS.forEach(t => console.log(`  - ${t.name}`));
		}
		break;
	default:
		console.log(`
📋 Area9 Performance Test Suite

Usage:
	node src/app.js [command] [options]

Commands:
	priority       Run priority tests only (6 tests)
	implemented    Run all implemented tests (8 tests including Open Review + SCORM)
	all           Run all tests (including unfinished ones - will error)
	single <name> Run a single test by name (partial match)

Options:
	--visible, -v  Show browser window (for watching tests run)
	--slow, -s     Add pauses to observe what's happening

NPM Scripts:
	npm run priority        Run priority tests (headless)
	npm run priority-watch  Run priority tests (visible + slow)
	npm run show-accounts   Show which account each test uses

Examples:
	node src/app.js priority                    # Run 6 priority tests headless
	node src/app.js implemented --visible       # Run 8 implemented tests visible
	node src/app.js single "open scorm" -v -s   # Test the new SCORM functionality
	node src/app.js single "open review" -v     # Test the review functionality
	node src/app.js priority --visible --slow   # Watch all priority tests slowly

Available Tests:
${ALL_TESTS.map(t => `  - ${t.name}`).join('\n')}

Priority Tests:
${PRIORITY_TESTS.map(t => `  - ${t.name} (*)`).join('\n')}

🔐 Account Management:
Each test uses a unique account to prevent conflicts and enable parallel testing.
Use 'npm run show-accounts' to see the complete account assignment matrix.
		`);
		break;
}