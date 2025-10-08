// src/workflowsCache/compareLoginCurator.js
// Cache comparison workflow with smart waits, session management, and retry logic

import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { logger } from "../utils/logger.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { buildCuratorUrl } from "../utils/config.js";
import { logColdResult, logWarmResult, logCacheComparison } from "../utils/log.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout, dismissOverlays } from "../utils/auth.js";

/**
 * Clear session (cookies, storage) between cold and warm runs
 * BUT preserve disk cache for cache comparison
 */
async function clearSessionPreservingCache(driver) {
	try {
		logger.info("🧹 Clearing session (preserving cache)...");

		// Clear cookies only - this resets auth but keeps cache
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

		logger.info("✅ Session cleared (cache preserved)");
	} catch (error) {
		logger.warn(`⚠️ Session clear error: ${error.message}`);
	}
}

/** One login attempt with page load and login timing */
async function performSingleLogin(driver, loginType) {
	logger.info(`🎯 Performing ${loginType} curator login...`);

	// --- PAGE LOAD TIMING ---
	logger.info(`🌐 Measuring ${loginType} page load...`);
	const pageLoadStart = Date.now();
	await driver.get(buildCuratorUrl());

	// Wait for page load and username field
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});

	const pageLoadSeconds = Number(((Date.now() - pageLoadStart) / 1000).toFixed(3));
	logger.info(`⏱ ${loginType} page load took: ${pageLoadSeconds}s`);

	// Fill login form
	await emailField.sendKeys(getAccountForTest("Login Curator Cache"));

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// --- LOGIN TIMING ---
	logger.info(`🚀 Starting ${loginType} login timer...`);
	const loginStart = Date.now();

	// Retry click up to 3 times
	let loginClicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			await waitFor.smartClick(driver, signInBtn);
			loginClicked = true;
			break;
		} catch (e) {
			logger.warn(`⚠️ Login click attempt ${attempt} failed: ${e.message}`);
			if (attempt < 3) {
				await waitFor.networkIdle(driver, 500, 3000);
				// Re-fetch button
				const retryBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
					clickable: true
				});
				signInBtn = retryBtn;
			} else {
				throw e;
			}
		}
	}

	if (!loginClicked) {
		throw new Error("Could not click sign in button after retries");
	}

	// Wait for login to complete (curator needs more time)
	await waitFor.loginComplete(driver, 'curator', 25000);

	const loginSeconds = Number(((Date.now() - loginStart) / 1000).toFixed(3));
	logger.info(`⏱ ${loginType} login took: ${loginSeconds}s`);
	logger.debug(`✅ ${loginType} curator login success detected`);

	// Dismiss overlay if shown
	await dismissOverlays(driver);

	// Wait for page to stabilize
	await waitFor.networkIdle(driver, 1000, 5000);

	// Debug helpers
	await logCurrentState(driver, "Login Curator Cache");
	await pauseForObservation(driver, `${loginType} curator login completed`, 1);

	return { pageLoadSeconds, loginSeconds };
}

/** Main comparison workflow */
export async function compareLoginCurator(driver) {
	logger.info("🔬 Login Curator Cache Comparison - Cold vs Warm performance");

	// COLD
	logger.info("\n❄️  Login Curator — COLD (no cache)");
	const cold = await performSingleLogin(driver, "COLD");
	const account = getAccountForTest("Login Curator Cache");
	logColdResult("Login Curator (page load)", cold.pageLoadSeconds, account);
	logColdResult("Login Curator (login)", cold.loginSeconds, account);

	// Logout and clear session (preserve cache)
	await performLogout(driver, 'curator');
	await clearSessionPreservingCache(driver);
	await new Promise(r => setTimeout(r, 2000));

	// WARM
	logger.info("\n🔥 Login Curator — WARM (cached resources)");
	const warm = await performSingleLogin(driver, "WARM");
	logWarmResult("Login Curator (page load)", warm.pageLoadSeconds, account);
	logWarmResult("Login Curator (login)", warm.loginSeconds, account);

	// Final logout
	await performLogout(driver, 'curator');

	// Results summary
	logger.info(`\n📊 Login Curator Cache Comparison Results:`);

	// Page load
	const pageDiff = cold.pageLoadSeconds - warm.pageLoadSeconds;
	const pagePct = (pageDiff / cold.pageLoadSeconds * 100).toFixed(1);
	logger.always(`   🌐 Page load:`);
	logger.always(`      ❄️ Cold: ${cold.pageLoadSeconds.toFixed(3)}s`);
	logger.always(`      🔥 Warm: ${warm.pageLoadSeconds.toFixed(3)}s`);
	logger.always(`      ⚡ Improvement: ${pageDiff.toFixed(3)}s (${pagePct}%)`);

	// Login
	const loginDiff = cold.loginSeconds - warm.loginSeconds;
	const loginPct = (loginDiff / cold.loginSeconds * 100).toFixed(1);
	logger.always(`   🔐 Login:`);
	logger.always(`      ❄️ Cold: ${cold.loginSeconds.toFixed(3)}s`);
	logger.always(`      🔥 Warm: ${warm.loginSeconds.toFixed(3)}s`);
	logger.always(`      ⚡ Difference: ${loginDiff.toFixed(3)}s (${loginPct}%)`);
	logger.always(`      (Expected: little/no cache effect here)`);

	// Log cache comparison data
	logCacheComparison("Login Curator (page load)", cold.pageLoadSeconds, warm.pageLoadSeconds, account);
	logCacheComparison("Login Curator (login)", cold.loginSeconds, warm.loginSeconds, account);

	// Return warm page load as the key metric
	return warm.pageLoadSeconds;
}
