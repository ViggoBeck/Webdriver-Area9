// Account assignment system - each test gets a unique account
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ACCOUNTS = {
	learner: [
		"A9-106821@area9.dk",
		"A9-106822@area9.dk",
		"A9-106823@area9.dk",
		"A9-106824@area9.dk",
		"A9-106825@area9.dk",
		"A9-106826@area9.dk",
		"A9-106827@area9.dk",
		"A9-106828@area9.dk",
		"A9-106829@area9.dk",
		"A9-106830@area9.dk"
	],
	educator: [
		"A9-106816@area9.dk",
		"A9-106817@area9.dk",
		"A9-106818@area9.dk",
		"A9-106819@area9.dk",
		"A9-106820@area9.dk"
	],
	curator: [
		"A9-106810@area9.dk",
		"A9-106811@area9.dk",
		"A9-106812@area9.dk",
		"A9-106813@area9.dk",
		"a9-106814@area9.dk",
		"A9-106815@area9.dk"
	]
};

// Assign specific accounts to specific tests for consistency and no conflicts
const TEST_ACCOUNT_ASSIGNMENTS = {
	// Working Tests (13 tests)
	"Login Learner": ACCOUNTS.learner[0],                    // A9-106821@area9.dk
	"Login Educator": ACCOUNTS.educator[0],                  // A9-106816@area9.dk
	"Login Curator": ACCOUNTS.curator[0],                    // A9-106810@area9.dk
	"Communicator Learner": ACCOUNTS.learner[1],             // A9-106822@area9.dk
	"Communicator Educator": ACCOUNTS.educator[1],           // A9-106817@area9.dk
	"Open SCORM": ACCOUNTS.learner[2],                       // A9-106823@area9.dk
	"Open Review": ACCOUNTS.educator[2],                     // A9-106818@area9.dk

	// Additional Future Tests (not yet implemented)
	"Open Video Probe": ACCOUNTS.learner[3],                 // A9-106824@area9.dk
	"Open Course Catalog": ACCOUNTS.learner[4],              // A9-106825@area9.dk (disabled - not working)
	"Analytics Educator": ACCOUNTS.educator[3],              // A9-106819@area9.dk
	"Open Class": ACCOUNTS.educator[4],                     // A9-106820@area9.dk (avoid conflict with Communicator Educator)
	"Create Class": ACCOUNTS.educator[0],                    // A9-106816@area9.dk (can reuse after Login test)
	"Delete Class": ACCOUNTS.educator[0],                    // A9-106816@area9.dk (same as Create Class to delete created tests)

	// Additional Curator Tests
	"Analytics Curator - Unique Users": ACCOUNTS.curator[1], // A9-106811@area9.dk
	"Open Unique Users Report": ACCOUNTS.curator[1],         // A9-106811@area9.dk (same as Analytics Curator - Unique Users)
	"Analytics Curator - Project Team": ACCOUNTS.curator[2], // A9-106812@area9.dk
	"Open Project Team Activity": ACCOUNTS.curator[2],       // A9-106812@area9.dk (same as Analytics Curator - Project Team)

	// Cache Comparison Tests
	"SCORM Cache": ACCOUNTS.learner[2],                      // A9-106823@area9.dk (same as Open SCORM)
	"Video Probe Cache": ACCOUNTS.learner[3],               // A9-106824@area9.dk (same as Open Video Probe)
	"Review Cache": ACCOUNTS.educator[2],                   // A9-106818@area9.dk (same as Open Review)
	"Course Catalog Cache": ACCOUNTS.learner[4],            // A9-106825@area9.dk (same as Open Course Catalog)
	"Create Class Cache": ACCOUNTS.educator[0],             // A9-106816@area9.dk (same as Create Class)
	"Open Class Cache": ACCOUNTS.educator[4]                // A9-106820@area9.dk (same as Open Class)
};

export function getAccountForTest(testName) {
	const account = TEST_ACCOUNT_ASSIGNMENTS[testName];

	if (!account) {
		console.warn(`⚠️  No assigned account for test: ${testName}. Using fallback.`);
		// Fallback to first account of each type
		if (testName.toLowerCase().includes('learner')) return ACCOUNTS.learner[0];
		if (testName.toLowerCase().includes('educator')) return ACCOUNTS.educator[0];
		if (testName.toLowerCase().includes('curator')) return ACCOUNTS.curator[0];
		return ACCOUNTS.learner[0]; // Ultimate fallback
	}

	return account;
}

export function getRandomAccount(role) {
	const roleAccounts = ACCOUNTS[role.toLowerCase()];
	if (!roleAccounts || roleAccounts.length === 0) {
		throw new Error(`No accounts available for role: ${role}`);
	}

	return roleAccounts[Math.floor(Math.random() * roleAccounts.length)];
}

export function getAllAccounts() {
	return ACCOUNTS;
}

export function getAccountAssignments() {
	return TEST_ACCOUNT_ASSIGNMENTS;
}

// Display account assignments for debugging
export function showAccountAssignments() {
	console.log("\n📋 Test Account Assignments:");
	console.log("=" .repeat(50));

	Object.entries(TEST_ACCOUNT_ASSIGNMENTS).forEach(([testName, account]) => {
		const role = account.includes('106821') || account.includes('106822') || account.includes('106823') ||
								account.includes('106824') || account.includes('106825') || account.includes('106826') ||
								account.includes('106827') || account.includes('106828') || account.includes('106829') ||
								account.includes('106830') ? 'LEARNER' :
								account.includes('106816') || account.includes('106817') || account.includes('106818') ||
								account.includes('106819') || account.includes('106820') ? 'EDUCATOR' : 'CURATOR';

		console.log(`${testName.padEnd(30)} → ${role.padEnd(8)} → ${account}`);
	});

	console.log("=" .repeat(50));
	console.log(`📊 Total: ${Object.keys(TEST_ACCOUNT_ASSIGNMENTS).length} tests with unique account assignments`);
}

// Default password for all accounts - loaded from environment variables
export const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "P@ssw0rd1234";

// Validate that password is loaded
if (!process.env.DEFAULT_PASSWORD) {
	console.warn("⚠️  DEFAULT_PASSWORD not found in .env file, using hardcoded fallback");
}