import fs from "fs";

// File path
const resultsFile = "results.csv";

// CSV header
const csvHeader = "timestamp,test_name,execution_time\n";

// Initialize CSV file with header if it doesn't exist or is empty
function initializeResultsFile() {
	if (!fs.existsSync(resultsFile) || fs.readFileSync(resultsFile, "utf8").trim() === "") {
		fs.writeFileSync(resultsFile, csvHeader, "utf8");
	}
}

// Initialize file on module load
initializeResultsFile();

export function logResult(testName, seconds) {
	const timestamp = new Date().toISOString();
	const line = `${timestamp},${testName},${seconds}\n`;

	fs.appendFileSync(resultsFile, line, "utf8");
}