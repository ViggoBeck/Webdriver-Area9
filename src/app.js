import { createDriver } from "./utils/driver.js";
import { loginLearner } from "./workflows/loginLearner.js";
import { loginEducator } from "./workflows/loginEducator.js";
import { loginCurator } from "./workflows/loginCurator.js";
import { communicatorLearner, communicatorEducator } from "./workflows/communicator.js";
import { openScorm } from "./workflows/openScorm.js";
import { openVideoProbe } from "./workflows/openVideoProbe.js";
import { openCourseCatalog } from "./workflows/openCourseCatalog.js";
import { openUniqueUsersReport } from "./workflows/openUniqueUsersReport.js";
import { openProjectTeamActivity } from "./workflows/OpenProjectTeam.js";
import { openClass } from "./workflows/openClass.js";
import { createClass } from "./workflows/createClass.js";
import { openReview } from "./workflows/openReview.js";
import { deleteClass } from "./workflows/deleteClass.js";
import { pageLoad } from "./workflows/pageLoad.js";
import { compareScorm } from "./workflowsCache/compareScorm.js";
import { compareVideoProbe } from "./workflowsCache/compareVideoProbe.js";
import { compareReview } from "./workflowsCache/compareReview.js";
import { compareCourseCatalog } from "./workflowsCache/compareCourseCatalog.js";
import { compareOpenClass } from "./workflowsCache/compareOpenClass.js";
import { compareLoginLearner } from "./workflowsCache/compareLoginLearner.js";
import { compareLoginEducator } from "./workflowsCache/compareLoginEducator.js";
import { compareLoginCurator } from "./workflowsCache/compareLoginCurator.js";
import { comparePageLoad } from "./workflowsCache/comparePageLoad.js";
import { logResult, showResultsInfo } from "./utils/log.js";
import { getAccountForTest } from "./utils/accounts.js";
import { validateConfig } from "./utils/config.js";

// Validate configuration on startup
try {
	validateConfig();
} catch (error) {
	console.error("❌ Configuration Error:", error.message);
	console.error("💡 Make sure you have a .env file with all required variables");
	process.exit(1);
}

// Clear browser session between tests to ensure clean login state
async function clearSession(driver) {
	try {
		console.log("🧹 Clearing session between tests...");

		// Check if the browser window is still available
		try {
			await driver.getTitle(); // Simple check to see if window exists
		} catch (windowError) {
			if (windowError.message.includes("no such window") ||
			    windowError.message.includes("target window already closed") ||
			    windowError.message.includes("web view not found")) {
				console.log("✅ Session already closed (likely due to logout) - skipping session clear");
				return;
			}
			throw windowError; // Re-throw if it's a different error
		}

		// More thorough session clearing for suite runs
		console.log("🔄 Performing thorough session reset...");

		// Clear all cookies, local storage, and session storage
		await driver.manage().deleteAllCookies();

		// Clear local and session storage via JavaScript
		await driver.executeScript("window.localStorage.clear();");
		await driver.executeScript("window.sessionStorage.clear();");

		// Navigate to about:blank to reset page state
		await driver.get("about:blank");
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Clear any cached data and ensure fresh state
		await driver.executeScript("window.localStorage.clear();");
		await driver.executeScript("window.sessionStorage.clear();");

		// Additional cleanup - clear any remaining browser state
		try {
			await driver.manage().deleteAllCookies();
		} catch (e) {
			// Continue if cookie clearing fails
		}

		// Wait for cleanup to complete
		await new Promise(resolve => setTimeout(resolve, 2000));

		console.log("✅ Session cleared successfully");
	} catch (error) {
		console.log("⚠️ Error clearing session:", error.message);
		// Continue anyway - not fatal
	}
}

// Working tests
const WORKING_TESTS = [
	{ name: "Login Learner", func: loginLearner },
	{ name: "Login Educator", func: loginEducator },
	{ name: "Login Curator", func: loginCurator },
	{ name: "Communicator Learner", func: communicatorLearner },
	{ name: "Communicator Educator", func: communicatorEducator },
	{ name: "Open SCORM", func: openScorm },
	{ name: "Open Video Probe", func: openVideoProbe },
	{ name: "Open Course Catalog", func: openCourseCatalog },
	{ name: "Open Unique Users Report", func: openUniqueUsersReport },
	{ name: "Open Project Team Activity", func: openProjectTeamActivity },
	{ name: "Open Class", func: openClass },
	{ name: "Create Class", func: createClass },
	{ name: "Delete Class", func: deleteClass },
	{ name: "Open Review", func: openReview },
	{ name: "Page Load", func: pageLoad }
];

// Priority tests from specifications (marked with * in test-specifications.md)
const PRIORITY_TESTS = [
	{ name: "Login Learner", func: loginLearner },
	{ name: "Login Educator", func: loginEducator },
	{ name: "Login Curator", func: loginCurator },
	{ name: "Communicator Learner", func: communicatorLearner },
	{ name: "Communicator Educator", func: communicatorEducator },
	{ name: "Open Course Catalog", func: openCourseCatalog }
];

// Learner-specific tests (all tests that use learner accounts with logout functionality)
const LEARNER_TESTS = [
	{ name: "Login Learner", func: loginLearner },
	{ name: "Communicator Learner", func: communicatorLearner },
	{ name: "Open SCORM", func: openScorm },
	{ name: "Open Video Probe", func: openVideoProbe },
	{ name: "Open Course Catalog", func: openCourseCatalog },
	{ name: "Page Load", func: pageLoad }
];

const ALL_TESTS = WORKING_TESTS;

// Cache comparison tests (cold vs warm in same session)
const CACHE_TESTS = [
	{ name: "Login Learner Cache", func: compareLoginLearner },
	{ name: "Login Educator Cache", func: compareLoginEducator },
	{ name: "Login Curator Cache", func: compareLoginCurator },
	{ name: "SCORM Cache", func: compareScorm },
	{ name: "Video Probe Cache", func: compareVideoProbe },
	{ name: "Review Cache", func: compareReview },
	{ name: "Course Catalog Cache", func: compareCourseCatalog },
	{ name: "Open Class Cache", func: compareOpenClass },
	{ name: "Page Load Cache", func: comparePageLoad }
];

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

				// Cache tests handle their own logging internally
				const isCacheTest = testSuite === CACHE_TESTS;
				if (!isCacheTest) {
					logResult(test.name, time, assignedAccount);
				}

				console.log(`✅ ${test.name} completed: ${time.toFixed(2)}s`);

				if (options.slowMode) {
					console.log("🐌 Slow mode: Pausing 5 seconds to observe results...");
					await new Promise(resolve => setTimeout(resolve, 5000));
				}

				// Clear session between tests to ensure clean state (skip for cache tests)
				if (!isCacheTest) {
					await clearSession(driver);
				}

				// Longer pause between tests to avoid overwhelming the server (especially in batch mode)
				const pauseTime = options.slowMode ? 5000 : 3000;
				await new Promise(resolve => setTimeout(resolve, pauseTime));
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

		// Show CSV results info
		showResultsInfo();
	}
}

async function runPriorityTests(options = {}) {
	await runTests(PRIORITY_TESTS, "Priority Tests", options);
}

async function runWorkingTests(options = {}) {
	await runTests(WORKING_TESTS, "Working Tests", options);
}

async function runAllTests(options = {}) {
	await runTests(ALL_TESTS, "All Tests", options);
}



async function runLearnerTests(options = {}) {
	await runTests(LEARNER_TESTS, "Learner Tests", options);
}

async function runCacheTests(options = {}) {
	await runTests(CACHE_TESTS, "Cache Comparison Tests", options);
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
	case "working":
		runWorkingTests(options);
		break;
	case "all":
		runAllTests(options);
		break;
	case "learners":
		runLearnerTests(options);
		break;
	case "cache":
		runCacheTests(options);
		break;

	case "single":
		// Run a single test by name
		const testName = args[1];

		if (!testName) {
			console.log("❌ Please specify a test name.");
			console.log("\nRegular Tests:");
			ALL_TESTS.forEach(t => console.log(`  - ${t.name}`));
			console.log("\nCache Tests:");
			CACHE_TESTS.forEach(t => console.log(`  - ${t.name}`));
			break;
		}

		const lowerTestName = testName.toLowerCase();

		// Try exact matches first (both regular and cache)
		let exactTest = ALL_TESTS.find(t => t.name.toLowerCase() === lowerTestName);
		let exactCacheTest = CACHE_TESTS.find(t => t.name.toLowerCase() === lowerTestName);

		if (exactTest) {
			console.log(`🎯 Found exact match: ${exactTest.name}`);
			runTests([exactTest], `Single Test: ${exactTest.name}`, options);
			break;
		}

		if (exactCacheTest) {
			console.log(`🎯 Found exact cache match: ${exactCacheTest.name}`);
			runTests([exactCacheTest], `Single Cache Test: ${exactCacheTest.name}`, options);
			break;
		}

		// Try partial matches - prefer regular tests over cache tests
		const test = ALL_TESTS.find(t => t.name.toLowerCase().includes(lowerTestName));
		if (test) {
			console.log(`🔍 Found regular test match: ${test.name}`);
			runTests([test], `Single Test: ${test.name}`, options);
			break;
		}

		// Check cache tests as fallback
		const cacheTest = CACHE_TESTS.find(t => t.name.toLowerCase().includes(lowerTestName));
		if (cacheTest) {
			console.log(`🔍 Found cache test match: ${cacheTest.name}`);
			runTests([cacheTest], `Single Cache Test: ${cacheTest.name}`, options);
			break;
		}

		// No matches found
		console.log(`❌ Test not found: "${testName}". Available tests:`);
		console.log("\nRegular Tests:");
		ALL_TESTS.forEach(t => console.log(`  - ${t.name}`));
		console.log("\nCache Tests:");
		CACHE_TESTS.forEach(t => console.log(`  - ${t.name}`));
		break;

	default:
		console.log(`
📋 Area9 Performance Test Suite

Usage:
	node src/app.js [command] [options]

Commands:
	priority         Run priority tests only (6 tests - core login, communicator, course catalog)
	working          Run all working tests (15 tests including SCORM, Video, Catalog, Analytics, Classes, Review, Delete, Page Load)
	all             Run all working tests (same as 'working')
	learners        Run learner tests only (6 tests - all tests using learner accounts with logout)
	cache           Run cache comparison tests (9 tests - cold vs warm in same session)
	single <name>   Run a single test by name (partial match - works for both regular and cache tests)

Options:
	--visible, -v           Show browser window (for watching tests run)
	--slow, -s              Add pauses to observe what's happening

NPM Scripts:
	npm run priority        Run priority tests (headless)
	npm run priority-watch  Run priority tests (visible + slow)
	npm run show-accounts   Show which account each test uses

Examples:
	node src/app.js priority                    # Run priority tests headless
	node src/app.js working --visible           # Run all working tests visible
	node src/app.js learners --visible --slow   # Run all learner tests (visual + slow)
	node src/app.js cache --visible --slow      # Run cache comparison tests (visual + slow)
	node src/app.js single "video" --visible    # Run just Video Probe cache comparison
	node src/app.js single "scorm" --visible    # Run just SCORM cache comparison
	node src/app.js single "open review" -v -s  # Test review functionality (slow + visible)
	node src/app.js single "login learner"      # Test login functionality
	node src/app.js priority --visible --slow   # Watch priority tests slowly

Working Tests (15):
${ALL_TESTS.map(t => `  - ${t.name}`).join('\n')}

Priority Tests (6):
${PRIORITY_TESTS.map(t => `  - ${t.name} (*)`).join('\n')}

Learner Tests (6):
${LEARNER_TESTS.map(t => `  - ${t.name} (with logout)`).join('\n')}

Cache Comparison Tests (9 total - Cold vs Warm):
${CACHE_TESTS.map(t => `  - ${t.name} (same session)`).join('\n')}

🔐 Account Management:
Each test uses a unique account to prevent conflicts and enable parallel testing.
Use 'npm run show-accounts' to see the complete account assignment matrix.
		`);
		break;
} 