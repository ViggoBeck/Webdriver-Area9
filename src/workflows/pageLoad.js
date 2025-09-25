// src/workflows/pageLoad.js
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function pageLoad(driver) {
	console.log("🚀 Starting Page Load test (cold measurement)...");

	// Navigate to page and start timing
	console.log("🎯 Measuring cold page load performance...");
	console.log("🚀 Starting page load timer...");
	await driver.get(buildLearnerUrl());

	// Wait until browser signals full load
	await driver.wait(async () => {
		const state = await driver.executeScript("return document.readyState");
		return state === "complete";
	}, DEFAULT_TIMEOUT);

	// Extract performance timings (Navigation Timing API)
	const perf = await driver.executeScript("return window.performance.timing");

	if (!perf || !perf.navigationStart || !perf.loadEventEnd) {
		throw new Error("❌ Performance timing not available");
	}

	const pageLoadSeconds = Number(((perf.loadEventEnd - perf.navigationStart) / 1000).toFixed(3));
	console.log(`⏱ Page load took: ${pageLoadSeconds}s`);

	await logCurrentState(driver, "Page Load");
	await pauseForObservation(driver, "Page load completed", 3);

	console.log("✨ Page Load test finished");
	return pageLoadSeconds;
}