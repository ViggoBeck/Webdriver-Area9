import fs from "fs";

export function logResult(testName, seconds) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp},${testName},${seconds}\n`;

  fs.appendFileSync("results.csv", line, "utf8");
}