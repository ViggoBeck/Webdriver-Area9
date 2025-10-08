import fs from "fs";
import path from "path";

// Base results directory
const resultsBaseDir = "results";
if (!fs.existsSync(resultsBaseDir)) {
	fs.mkdirSync(resultsBaseDir, { recursive: true });
}

// Generate date and time for this test run
function generateDateAndTime() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	return {
		date: `${year}-${month}-${day}`,
		time: `${hours}-${minutes}-${seconds}`,
		fullTimestamp: `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`
	};
}

// Get date and time for this test run
const { date, time, fullTimestamp } = generateDateAndTime();

// Create date-specific directory
const resultsDir = path.join(resultsBaseDir, date);
if (!fs.existsSync(resultsDir)) {
	fs.mkdirSync(resultsDir, { recursive: true });
}

// Create timestamped filenames for this test run
const csvFiles = {
	normal: path.join(resultsDir, `results-normal_${time}.csv`),
	cold: path.join(resultsDir, `results-cold_${time}.csv`),
	warm: path.join(resultsDir, `results-warm_${time}.csv`),
	comparison: path.join(resultsDir, `results-cache-comparison_${time}.csv`)
};

// CSV headers for different file types
const csvHeaders = {
	normal: "timestamp,test_name,execution_time,account\n",
	cold: "timestamp,test_name,execution_time,account\n",
	warm: "timestamp,test_name,execution_time,account\n",
	comparison: "timestamp,test_name,cold_time,warm_time,improvement_seconds,improvement_percent,account\n"
};

// Track which files have been initialized
const initializedFiles = new Set();

// Initialize CSV file with header (lazy initialization - only when first used)
function initializeResultsFile(fileType) {
	if (initializedFiles.has(fileType)) {
		return; // Already initialized
	}

	const filePath = csvFiles[fileType];
	const header = csvHeaders[fileType];

	fs.writeFileSync(filePath, header, "utf8");
	console.log(`📊 Created ${path.basename(filePath)}`);
	initializedFiles.add(fileType);
}

// Display info on module load (but don't create files yet)
console.log(`\n📅 Test run: ${fullTimestamp}`);
console.log(`📂 Results folder: ${resultsDir}/`);

/** Log normal workflow test result */
export function logResult(testName, seconds, account = "") {
	initializeResultsFile('normal'); // Ensure file exists
	const timestamp = new Date().toISOString();
	const normalLine = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.normal, normalLine, "utf8");
}

/** Log cold cache test result */
export function logColdResult(testName, seconds, account = "") {
	initializeResultsFile('cold'); // Ensure file exists
	const timestamp = new Date().toISOString();
	const line = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.cold, line, "utf8");
}

/** Log warm cache test result */
export function logWarmResult(testName, seconds, account = "") {
	initializeResultsFile('warm'); // Ensure file exists
	const timestamp = new Date().toISOString();
	const line = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.warm, line, "utf8");
}

/** Log cache comparison result (cold vs warm) */
export function logCacheComparison(testName, coldTime, warmTime, account = "") {
	initializeResultsFile('comparison'); // Ensure file exists
	const timestamp = new Date().toISOString();
	const improvement = coldTime - warmTime;
	const improvementPercent = ((improvement / coldTime) * 100).toFixed(1);

	const line = `${timestamp},${testName},${coldTime},${warmTime},${improvement},${improvementPercent}%,${account}\n`;
	fs.appendFileSync(csvFiles.comparison, line, "utf8");
}

/** Helper: Get account from test name lookup */
function getAccountForTestName(testName) {
	// This will be enhanced later if needed
	return "";
}

/** Display CSV file locations */
export function showResultsInfo() {
	if (initializedFiles.size === 0) {
		console.log("\n📊 No results were generated this run");
		return;
	}

	console.log("\n📊 Results saved to date-organized CSV files:");

	if (initializedFiles.has('normal')) {
		console.log(`   📁 ${date}/${path.basename(csvFiles.normal)}`);
	}
	if (initializedFiles.has('cold')) {
		console.log(`   📁 ${date}/${path.basename(csvFiles.cold)}`);
	}
	if (initializedFiles.has('warm')) {
		console.log(`   📁 ${date}/${path.basename(csvFiles.warm)}`);
	}
	if (initializedFiles.has('comparison')) {
		console.log(`   📁 ${date}/${path.basename(csvFiles.comparison)}`);
	}

	console.log(`\n📂 Full path: ${resultsDir}/`);
}

/** Export current test run timestamp */
export function getTestRunTimestamp() {
	return fullTimestamp;
}

/** Export current test run date (folder name) */
export function getTestRunDate() {
	return date;
}

/** Export CSV file paths for external use (e.g., report generation) */
export function getCsvFiles() {
	return csvFiles;
}