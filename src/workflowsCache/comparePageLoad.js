// src/workflowsCache/comparePageLoad.js
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { logColdResult, logWarmResult, logCacheComparison } from "../utils/log.js";
import { getAccountForTest } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

/** Single page load measurement using Performance API */
async function measurePageLoad(driver, label) {
	console.log(`🎯 Measuring ${label} page load...`);

	// Navigate to page and start timing
	console.log(`🚀 Starting ${label} page load timer...`);
	await driver.get(buildLearnerUrl());

	// Wait until browser signals full load
	await driver.wait(async () => {
		const state = await driver.executeScript("return document.readyState");
		return state === "complete";
	}, DEFAULT_TIMEOUT);

	// Extract performance timings (Navigation Timing API)
	const perf = await driver.executeScript("return window.performance.timing");

	if (!perf || !perf.navigationStart || !perf.loadEventEnd) {
		throw new Error(`❌ Performance timing not available for ${label} load`);
	}

	const pageLoadSeconds = Number(((perf.loadEventEnd - perf.navigationStart) / 1000).toFixed(3));
	console.log(`⏱ ${label} full page load took: ${pageLoadSeconds}s`);

	await logCurrentState(driver, "Page Load Cache");
	await pauseForObservation(driver, `${label} page load completed`, 1);

	return pageLoadSeconds;
}

/** Main comparison workflow */
export async function comparePageLoad(driver) {
	console.log("🔬 Page Load Cache Comparison - Cold vs Warm");

	// COLD (no cache)
	console.log("\n❄️  Page Load — COLD (first load, no cache)");
	const cold = await measurePageLoad(driver, "COLD");
	const account = getAccountForTest("Page Load Cache");
	logColdResult("Page Load", cold, account);

	// WARM (with cache)
	console.log("\n🔥 Page Load — WARM (cached resources)");
	const warm = await measurePageLoad(driver, "WARM");
	logWarmResult("Page Load", warm, account);

	// Results summary
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);

	console.log(`\n📊 Page Load Cache Comparison Results:`);
	console.log(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	console.log(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	console.log(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Log cache comparison data
	logCacheComparison("Page Load", cold, warm, account);

	// Return warm load time as primary metric
	return warm;
}