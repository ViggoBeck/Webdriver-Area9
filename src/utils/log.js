import fs from "fs";
import path from "path";

// Ensure results directory exists
const resultsDir = "results";
if (!fs.existsSync(resultsDir)) {
	fs.mkdirSync(resultsDir, { recursive: true });
}

// File paths
const allResultsFile = path.join(resultsDir, "results-all.csv");
const warmResultsFile = path.join(resultsDir, "results-warm.csv");
const coldResultsFile = path.join(resultsDir, "results-cold.csv");
const legacyResultsFile = "results.csv";

// CSV header
const csvHeader = "timestamp,test_name,execution_time,cache_status\n";
const legacyCsvHeader = "timestamp,test_name,execution_time\n";

// Initialize CSV files with headers if they don't exist or are empty
function initializeResultsFiles() {
	// Helper function to check if file needs header
	const needsHeader = (filePath) => {
		return !fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8").trim() === "";
	};

	if (needsHeader(allResultsFile)) {
		fs.writeFileSync(allResultsFile, csvHeader, "utf8");
	}
	if (needsHeader(warmResultsFile)) {
		fs.writeFileSync(warmResultsFile, csvHeader, "utf8");
	}
	if (needsHeader(coldResultsFile)) {
		fs.writeFileSync(coldResultsFile, csvHeader, "utf8");
	}
	if (needsHeader(legacyResultsFile)) {
		fs.writeFileSync(legacyResultsFile, legacyCsvHeader, "utf8");
	}
}

// Initialize files on module load
initializeResultsFiles();

export function logResult(testName, seconds, cacheDisabled = false) {
	const timestamp = new Date().toISOString();
	const cacheStatus = cacheDisabled ? "COLD" : "WARM";
	const line = `${timestamp},${testName},${seconds},${cacheStatus}\n`;

	// Determine specific results file
	const specificResultsFile = cacheDisabled ? coldResultsFile : warmResultsFile;

	// Write to both all-results file and specific cache mode file
	fs.appendFileSync(allResultsFile, line, "utf8");
	fs.appendFileSync(specificResultsFile, line, "utf8");

	// Also write to legacy results.csv for backward compatibility
	const legacyLine = `${timestamp},${testName},${seconds}\n`;
	fs.appendFileSync(legacyResultsFile, legacyLine, "utf8");
}