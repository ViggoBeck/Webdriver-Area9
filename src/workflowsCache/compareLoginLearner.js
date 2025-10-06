// src/workflowsCache/compareLoginLearner.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { DEFAULT_TIMEOUT } from "../utils/config.js";
import { logColdResult, logWarmResult, logCacheComparison } from "../utils/log.js";

/** Dismiss overlay if present */
async function dismissOverlay(driver) {
	try {
		const gotItBtn = await driver.findElement(By.xpath("//*[normalize-space(text())='GOT IT']"));
		if (await gotItBtn.isDisplayed()) {
			console.log("✅ Dismissing overlay...");
			await driver.executeScript("arguments[0].click();", gotItBtn);
			await driver.wait(until.stalenessOf(gotItBtn), 10000);
		}
	} catch {
		// No overlay present
	}
}

/** Logout without clearing cache */
async function logoutPreservingCache(driver) {
	console.log("🔄 Logging out (preserving cache)...");

	// Open menu
	const menuBtn = await driver.wait(
		until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
		DEFAULT_TIMEOUT
	);
	await driver.executeScript("arguments[0].click();", menuBtn);

	// Click logout
	const logoutBtn = await driver.wait(
		until.elementLocated(By.xpath("//button[@aria-label='LOGOUT']")),
		DEFAULT_TIMEOUT
	);
	await driver.executeScript("arguments[0].click();", logoutBtn);

	// Wait for login form
	await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	console.log("✅ Logout successful - cache preserved");
}

/** One login attempt with:
 *  - page load (cold/warm)
 *  - login timing
 */
async function performSingleLogin(driver, loginType) {
	console.log(`🎯 Performing ${loginType} login...`);

	// --- PAGE LOAD TIMING ---
	console.log(`🌐 Measuring ${loginType} page load...`);
	const pageLoadStart = Date.now();
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		DEFAULT_TIMEOUT
	);
	const pageLoadSeconds = Number(((Date.now() - pageLoadStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} page load took: ${pageLoadSeconds}s`);

	// Fill login form
	await emailField.sendKeys(getAccountForTest("Login Learner"));
	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);
	const signInBtn = await driver.findElement(By.id("sign_in"));

	// --- LOGIN TIMING ---
	console.log(`🚀 Starting ${loginType} login timer...`);
	const loginStart = Date.now();
	await signInBtn.click();

	// Wait for a first dashboard indicator
	const successSelectors = [
		By.css('button[aria-label*="Benchmark Test"]'),
		By.xpath("//*[contains(text(), 'Dashboard')]"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//nav | //header"),
		By.xpath("//*[contains(@class, 'dashboard')]")
	];

	let loginSuccess = false;
	for (const selector of successSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ ${loginType} login success detected`);
			loginSuccess = true;
			break;
		} catch {
			// Try next selector
		}
	}

	if (!loginSuccess) {
		throw new Error(`❌ Could not verify ${loginType} login success`);
	}

	const loginSeconds = Number(((Date.now() - loginStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} login took: ${loginSeconds}s`);

	// Dismiss overlay if shown
	await dismissOverlay(driver);

	// Debug helpers
	await logCurrentState(driver, "Login Learner Cache");
	await pauseForObservation(driver, `${loginType} login completed`, 1);

	return { pageLoadSeconds, loginSeconds };
}

/** Main comparison workflow */
export async function compareLoginLearner(driver) {
	console.log("🔬 Login Learner Cache Comparison - Cold vs Warm performance");

	// COLD
	console.log("\n❄️  Login Learner — COLD (no cache)");
	const cold = await performSingleLogin(driver, "COLD");
	const account = getAccountForTest("Login Learner Cache");
	logColdResult("Login Learner (page load)", cold.pageLoadSeconds, account);
	logColdResult("Login Learner (login)", cold.loginSeconds, account);

	// Logout (preserve cache)
	await logoutPreservingCache(driver);
	await new Promise(r => setTimeout(r, 2000));

	// WARM
	console.log("\n🔥 Login Learner — WARM (cached resources)");
	const warm = await performSingleLogin(driver, "WARM");
	logWarmResult("Login Learner (page load)", warm.pageLoadSeconds, account);
	logWarmResult("Login Learner (login)", warm.loginSeconds, account);

	// Final logout
	await logoutPreservingCache(driver);

	// Results summary
	console.log(`\n📊 Login Learner Cache Comparison Results:`);

	// Page load
	const pageDiff = cold.pageLoadSeconds - warm.pageLoadSeconds;
	const pagePct = (pageDiff / cold.pageLoadSeconds * 100).toFixed(1);
	console.log(`   🌐 Page load:`);
	console.log(`      ❄️ Cold: ${cold.pageLoadSeconds.toFixed(3)}s`);
	console.log(`      🔥 Warm: ${warm.pageLoadSeconds.toFixed(3)}s`);
	console.log(`      ⚡ Improvement: ${pageDiff.toFixed(3)}s (${pagePct}%)`);

	// Login
	const loginDiff = cold.loginSeconds - warm.loginSeconds;
	const loginPct = (loginDiff / cold.loginSeconds * 100).toFixed(1);
	console.log(`   🔐 Login:`);
	console.log(`      ❄️ Cold: ${cold.loginSeconds.toFixed(3)}s`);
	console.log(`      🔥 Warm: ${warm.loginSeconds.toFixed(3)}s`);
	console.log(`      ⚡ Difference: ${loginDiff.toFixed(3)}s (${loginPct}%)`);
	console.log(`      (Expected: little/no cache effect here)`);

	// Log cache comparison data
	logCacheComparison("Login Learner (page load)", cold.pageLoadSeconds, warm.pageLoadSeconds, account);
	logCacheComparison("Login Learner (login)", cold.loginSeconds, warm.loginSeconds, account);

	// Return warm page load as the key metric
	return warm.pageLoadSeconds;
}