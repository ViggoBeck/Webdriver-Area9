import { Builder } from "selenium-webdriver";
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
const ALL_TESTS = [
	...PRIORITY_TESTS,
	{ name: "Open Review", func: openReview },
	{ name: "Open SCORM", func: openScorm },
	{ name: "Open Video Probe", func: openVideoProbe },
	{ name: "Analytics Educator", func: analyticsEducator },
	{ name: "Analytics Curator - Unique Users", func: analyticsCuratorUniqueUsers },
	{ name: "Analytics Curator - Project Team", func: analyticsCuratorProjectTeam },
	{ name: "Open Class", func: openClass },
	{ name: "Create Class", func: createClass },
	{ name: "Delete Class", func: deleteClass }
];

async function runTests(testSuite, suiteName) {
	console.log(`\n🚀 Starting ${suiteName}...`);
	const driver = await new Builder().forBrowser("chrome").build();

	try {
		for (const test of testSuite) {
			console.log(`\n⏳ Running: ${test.name}`);
			try {
				const time = await test.func(driver);
				logResult(test.name, time);
				console.log(`✅ ${test.name} completed: ${time.toFixed(2)}s`);

				// Short pause between tests to avoid overwhelming the server
				await new Promise(resolve => setTimeout(resolve, 2000));
			} catch (testErr) {
				console.error(`❌ Error in ${test.name}:`, testErr.message);
				logResult(test.name, "ERROR");
			}
		}
	} catch (err) {
		console.error("❌ General error during tests:", err);
	} finally {
		await driver.quit();
		console.log(`\n✨ ${suiteName} completed\n`);
	}
}

async function runPriorityTests() {
	await runTests(PRIORITY_TESTS, "Priority Tests");
}

async function runAllTests() {
	await runTests(ALL_TESTS, "All Tests");
}

// Check command line arguments to determine which tests to run
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
	case "priority":
		runPriorityTests();
		break;
	case "all":
		runAllTests();
		break;
	case "single":
		// Run a single test by name
		const testName = args[1];
		const test = ALL_TESTS.find(t => t.name.toLowerCase().includes(testName?.toLowerCase()));
		if (test) {
			runTests([test], `Single Test: ${test.name}`);
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
	priority    Run priority tests only (marked with * in specs)
	all        Run all available tests
	single <name>  Run a single test by name (partial match)

Examples:
	node src/app.js priority
	node src/app.js all
	node src/app.js single "login learner"
	node src/app.js single curator

Available Tests:
${ALL_TESTS.map(t => `  - ${t.name}`).join('\n')}

Priority Tests:
${PRIORITY_TESTS.map(t => `  - ${t.name} (*)`).join('\n')}
		`);
		break;
}