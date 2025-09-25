// src/workflowsCache/compareLoginEducator.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
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

/** Simple cache preservation - just wait between tests */
async function resetSessionPreservingCache(driver) {
	console.log("🔄 Preserving cache between tests...");

	// Simple approach: just wait to ensure session state resets
	// while preserving browser cache
	await new Promise(r => setTimeout(r, 2000));

	console.log("✅ Cache preserved - ready for warm test");
}

/** Single login attempt with precise timing */
async function performSingleLogin(driver, loginType) {
	console.log(`🎯 Performing ${loginType} educator login...`);

	// Navigate to educator login page
	console.log(`🚀 Starting ${loginType} educator login timer...`);
	const start = Date.now();

	await driver.get(buildEducatorUrl());
	await new Promise(r => setTimeout(r, 2000)); // Wait for page load

	// Fill login form
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		DEFAULT_TIMEOUT
	);
	await emailField.sendKeys(getAccountForTest("Login Educator"));

	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		DEFAULT_TIMEOUT
	);
	await signInBtn.click();

	// Wait for successful login (using same detection as original)
	const successSelectors = [
		By.xpath("//*[text()='Dashboard']"),
		By.xpath("//*[contains(text(), 'Dashboard')]"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//nav | //header"),
		By.xpath("//*[contains(@class, 'dashboard')]")
	];

	let loginSuccess = false;
	for (const selector of successSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 5000);
			console.log(`✅ ${loginType} educator login success detected`);
			loginSuccess = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	if (!loginSuccess) {
		// Fallback: check if login form disappeared
		await new Promise(r => setTimeout(r, 2000));
		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		if (loginForms.length === 0) {
			console.log(`✅ ${loginType} educator login form disappeared - login successful`);
			loginSuccess = true;
		}
	}

	if (!loginSuccess) {
		throw new Error(`❌ Could not verify ${loginType} educator login success`);
	}

	// Stop timer
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} educator login took: ${seconds}s`);

	// Dismiss any overlay
	await dismissOverlay(driver);

	await logCurrentState(driver, "Login Educator Cache");
	await pauseForObservation(driver, `${loginType} educator login completed`, 1);

	return seconds;
}

/** Main comparison workflow */
export async function compareLoginEducator(driver) {
	console.log("🔬 Login Educator Cache Comparison - Cold vs Warm login performance");

	// COLD: First login (no cache)
	console.log("\n❄️  Login Educator — COLD (first login, no cache)");
	const cold = await performSingleLogin(driver, "COLD");
	const account = getAccountForTest("Login Educator Cache");
	logColdResult("Login Educator", cold, account);

	// Reset session while preserving cache
	await resetSessionPreservingCache(driver);
	await new Promise(r => setTimeout(r, 2000));

	// WARM: Second login (with cached resources)
	console.log("\n🔥 Login Educator — WARM (second login, cached resources)");
	const warm = await performSingleLogin(driver, "WARM");
	logWarmResult("Login Educator", warm, account);

	// Results summary
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	console.log(`\n📊 Login Educator Cache Comparison Results:`);
	console.log(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	console.log(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	console.log(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Log cache comparison data
	logCacheComparison("Login Educator", cold, warm, account);

	return warm;
}