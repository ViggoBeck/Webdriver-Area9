// src/workflowsCache/comparePageLoad.js
// Cache comparison workflow with smart waits, session management, and retry logic

import { DEFAULT_TIMEOUT } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import { logColdResult, logWarmResult, logCacheComparison } from "../utils/log.js";
import { getAccountForTest } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor } from "../utils/driver.js";

/**
 * Clear session (cookies, storage) between cold and warm runs
 */
async function clearSession(driver) {
	try {
		logger.info("🧹 Clearing session for warm run...");

		// Clear cookies
		try {
			await driver.manage().deleteAllCookies();
		} catch (e) {
			logger.info("⚠️ Cookie clearing failed:", e.message);
		}

		// Clear storage
		try {
			await driver.executeScript(`
				try {
					localStorage.clear();
					sessionStorage.clear();
				} catch (e) {}
			`);
		} catch (e) {
			logger.info("⚠️ Storage clearing failed:", e.message);
		}

		logger.info("✅ Session cleared");
	} catch (error) {
		logger.warn(`⚠️ Session clear error: ${error.message}`);
	}
}

/** Single page load measurement using Performance API */
async function measurePageLoad(driver, label) {
	logger.info(`🎯 Measuring ${label} page load...`);

	// Navigate to page and start timing
	logger.info(`🚀 Starting ${label} page load timer...`);
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Wait for page to fully load using network idle detection
	await waitFor.pageLoad(driver, {
		initialWait: 500,
		maxWait: DEFAULT_TIMEOUT,
		description: `${label} page load`
	});

	// Extract performance timings (Navigation Timing API)
	const perf = await driver.executeScript("return window.performance.timing");

	if (!perf || !perf.navigationStart || !perf.loadEventEnd) {
		throw new Error(`❌ Performance timing not available for ${label} load`);
	}

	const pageLoadSeconds = Number(((perf.loadEventEnd - perf.navigationStart) / 1000).toFixed(3));
	logger.info(`⏱ ${label} full page load took: ${pageLoadSeconds}s`);

	await logCurrentState(driver, "Page Load Cache");
	await pauseForObservation(driver, `${label} page load completed`, 1);

	return pageLoadSeconds;
}

/** Main comparison workflow */
export async function comparePageLoad(driver) {
	logger.info("🔬 Page Load Cache Comparison - Cold vs Warm");

	// COLD (no cache)
	logger.info("\n❄️  Page Load — COLD (first load, no cache)");
	const cold = await measurePageLoad(driver, "COLD");
	const account = getAccountForTest("Page Load Cache");
	logColdResult("Page Load", cold, account);

	// Clear session between cold and warm runs
	await clearSession(driver);

	// Brief pause to ensure session is fully cleared
	await new Promise(resolve => setTimeout(resolve, 1000));

	// WARM (with cache)
	logger.info("\n🔥 Page Load — WARM (cached resources)");
	const warm = await measurePageLoad(driver, "WARM");
	logWarmResult("Page Load", warm, account);

	// Results summary
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);

	logger.info(`\n📊 Page Load Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Log cache comparison data
	logCacheComparison("Page Load", cold, warm, account);

	// Return warm load time as primary metric
	return warm;
}
