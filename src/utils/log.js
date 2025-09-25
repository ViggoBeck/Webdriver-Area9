import fs from "fs";
import path from "path";

// Create results directory if it doesn't exist
const resultsDir = "results";
if (!fs.existsSync(resultsDir)) {
	fs.mkdirSync(resultsDir, { recursive: true });
}

// CSV file paths
const csvFiles = {
	normal: path.join(resultsDir, "results-normal.csv"),
	cold: path.join(resultsDir, "results-cold.csv"),
	warm: path.join(resultsDir, "results-warm.csv"),
	comparison: path.join(resultsDir, "results-cache-comparison.csv")
};

// CSV headers for different file types
const csvHeaders = {
	normal: "timestamp,test_name,execution_time,account\n",
	cold: "timestamp,test_name,execution_time,account\n",
	warm: "timestamp,test_name,execution_time,account\n",
	comparison: "timestamp,test_name,cold_time,warm_time,improvement_seconds,improvement_percent,account\n"
};

// Initialize CSV files with headers if they don't exist
function initializeResultsFile(fileType) {
	const filePath = csvFiles[fileType];
	const header = csvHeaders[fileType];

	if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8").trim() === "") {
		fs.writeFileSync(filePath, header, "utf8");
		console.log(`📊 Initialized ${filePath}`);
	}
}

// Initialize all files on module load
Object.keys(csvFiles).forEach(initializeResultsFile);

/** Log normal workflow test result */
export function logResult(testName, seconds, account = "") {
	const timestamp = new Date().toISOString();
	const normalLine = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.normal, normalLine, "utf8");
}

/** Log cold cache test result */
export function logColdResult(testName, seconds, account = "") {
	const timestamp = new Date().toISOString();
	const line = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.cold, line, "utf8");
}

/** Log warm cache test result */
export function logWarmResult(testName, seconds, account = "") {
	const timestamp = new Date().toISOString();
	const line = `${timestamp},${testName},${seconds},${account}\n`;
	fs.appendFileSync(csvFiles.warm, line, "utf8");
}

/** Log cache comparison result (cold vs warm) */
export function logCacheComparison(testName, coldTime, warmTime, account = "") {
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
	console.log("\n📊 Results are saved to organized CSV files:");
	console.log(`   📁 ${csvFiles.normal} - Normal workflow tests (baseline performance)`);
	console.log(`   📁 ${csvFiles.cold} - Cold cache test results`);
	console.log(`   📁 ${csvFiles.warm} - Warm cache test results`);
	console.log(`   📁 ${csvFiles.comparison} - Cache comparison analysis (cold vs warm)`);
}