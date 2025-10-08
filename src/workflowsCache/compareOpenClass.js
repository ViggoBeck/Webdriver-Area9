// src/workflowsCache/compareOpenClass.js
// Cache comparison workflow with smart waits, session management, and retry logic

import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { logger } from "../utils/logger.js";
import { buildEducatorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { logResult } from "../utils/log.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";

/** Single class opening process (assumes already on educator dashboard) */
async function openBenchmarkClass(driver) {
	logger.info("🎯 Measuring class opening for 'Benchmark Test 1 Do not touch'...");

	// --- LOCATE "Benchmark Test 1 Do not touch" CLASS ---
	logger.info("🔍 Looking for 'Benchmark Test 1 Do not touch' class...");

	const classElement = await waitFor.element(driver, selectorsFor.area9.classRow('Benchmark Test 1 Do not touch'), {
		timeout: 12000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Benchmark Test 1 class'
	});

	logger.info("✅ Found 'Benchmark Test 1 Do not touch' class");

	// Scroll into view
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", classElement);
	await new Promise(r => setTimeout(r, 500));

	// --- START TIMER + CLICK CLASS WITH RETRY ---
	logger.info("🚀 Starting timer - clicking class...");
	const start = Date.now();

	let classClicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			await waitFor.smartClick(driver, classElement);
			logger.info("✅ Clicked 'Benchmark Test 1 Do not touch' class");
			classClicked = true;
			break;
		} catch (e) {
			logger.warn(`⚠️ Class click attempt ${attempt} failed: ${e.message}`);
			if (attempt < 3) {
				await waitFor.networkIdle(driver, 500, 3000);
				// Re-fetch element
				const retryElement = await waitFor.element(driver, selectorsFor.area9.classRow('Benchmark Test 1 Do not touch'), {
					timeout: 5000,
					visible: true,
					clickable: true
				});
				classElement = retryElement;
			} else {
				throw e;
			}
		}
	}

	if (!classClicked) {
		throw new Error("Could not click class after retries");
	}

	// --- WAIT FOR CLASS CONTENT TO LOAD ---
	logger.info("⏳ Waiting for class content to fully load...");

	// Use application-specific completion detection
	await waitFor.classContent(driver, 15000);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Class open took: ${seconds}s`);

	await logCurrentState(driver, "Open Class Cache");
	await pauseForObservation(driver, "Class opened - viewing class content", 1);

	return seconds;
}

export async function compareOpenClass(driver) {
	logger.info("🔬 Open Class Cache Comparison - Cold vs Warm using dashboard navigation");

	// === ONE-TIME SETUP - LOGIN ===
	logger.info("🌐 Logging in as educator...");
	await driver.get(buildEducatorUrl());

	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Open Class Cache"));

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});
	await waitFor.smartClick(driver, signInBtn);

	// Wait for login to complete
	await waitFor.loginComplete(driver, 'educator', 20000);
	logger.info("✅ Educator dashboard loaded");

	// Dismiss overlays
	await dismissOverlays(driver);
	await waitFor.networkIdle(driver, 1000, 3000);

	// === COLD/WARM COMPARISON ===

	// COLD: First class opening
	logger.info("\n❄️  Open Class — COLD (first opening)");
	const cold = await openBenchmarkClass(driver);
	logResult("Open Class (cold)", cold);

	// Navigate back to dashboard for warm test
	logger.info("🔄 Navigating back to dashboard for warm test...");

	await driver.get(buildEducatorUrl());

	// Wait for dashboard to load
	await waitFor.loginComplete(driver, 'educator', 15000);
	logger.info("✅ Back to educator dashboard for warm test");

	// Wait for page to stabilize
	await waitFor.networkIdle(driver, 1000, 5000);

	// WARM: Second class opening (benefits from cache)
	logger.info("\n🔥 Open Class — WARM (second opening, cached)");
	const warm = await openBenchmarkClass(driver);
	logResult("Open Class (warm)", warm);

	// === CLEANUP ===
	await performLogout(driver, 'educator');

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	logger.info(`\n📊 Open Class Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result
	return warm;
}
