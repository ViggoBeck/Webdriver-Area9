// src/workflowsCache/compareLoginEducator.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { logColdResult, logWarmResult, logCacheComparison } from "../utils/log.js";

/** Dismiss overlay if present */
async function dismissOverlay(driver) {
	try {
		const gotItCandidates = await driver.findElements(
			By.xpath("//*[normalize-space(text())='GOT IT']")
		);
		for (let btn of gotItCandidates) {
			if (await btn.isDisplayed()) {
				console.log("✅ Found GOT IT overlay, dismissing...");
				await driver.executeScript("arguments[0].click();", btn);
				await driver.wait(until.stalenessOf(btn), 10000);
				console.log("✅ Overlay dismissed");
				break;
			}
		}
	} catch {
		console.log("ℹ️ No overlay detected");
	}
}

/** Logout handling for educator */
async function performLogoutEducator(driver) {
	console.log("🔄 Starting educator logout...");

	try {
		// Open menu
		const menuBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
			DEFAULT_TIMEOUT
		);
		await driver.executeScript("arguments[0].click();", menuBtn);
		console.log("✅ Menu opened");
		await new Promise(r => setTimeout(r, 1000));

		// Click logout (aria-label or visible text)
		const logoutBtn = await driver.wait(
			until.elementLocated(
				By.xpath("//button[@aria-label='LOGOUT' or contains(translate(., 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'LOGOUT')]")
			),
			DEFAULT_TIMEOUT
		);
		await driver.executeScript("arguments[0].click();", logoutBtn);
		console.log("✅ Logout clicked");

		// Verify login form
		await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
		console.log("✅ Logout successful (login form visible)");
	} catch (e) {
		console.log("⚠️ Logout failed, fallback to educator login page");
		await driver.get(buildEducatorUrl());
		await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	}
}

/** One login attempt with:
 *  - page load (cold/warm)
 *  - login timing
 */
async function performSingleLogin(driver, loginType) {
	console.log(`🎯 Performing ${loginType} educator login...`);

	// --- PAGE LOAD TIMING ---
	const pageLoadStart = Date.now();
	await driver.get(buildEducatorUrl());
	await new Promise(r => setTimeout(r, 1500)); // let UI render

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		DEFAULT_TIMEOUT
	);
	const pageLoadSeconds = Number(((Date.now() - pageLoadStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} page load took: ${pageLoadSeconds}s`);

	// Fill login form
	await emailField.sendKeys(getAccountForTest("Login Educator"));
	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);
	const signInButton = await driver.findElement(By.id("sign_in"));

	// --- LOGIN TIMING ---
	const loginStart = Date.now();
	await signInButton.click();

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
			console.log(`✅ ${loginType} educator login success via: ${selector}`);
			loginSuccess = true;
			break;
		} catch {}
	}

	if (!loginSuccess) {
		await new Promise(r => setTimeout(r, 2000));
		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		if (loginForms.length === 0) {
			console.log(`✅ Login form disappeared - ${loginType} educator login successful`);
			loginSuccess = true;
		}
	}

	if (!loginSuccess) throw new Error(`❌ Could not verify ${loginType} educator login success`);

	const loginSeconds = Number(((Date.now() - loginStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} login took: ${loginSeconds}s`);

	// Cleanup
	await dismissOverlay(driver);
	await logCurrentState(driver, "Login Educator Cache");
	await pauseForObservation(driver, `${loginType} educator login completed`, 1);

	return { pageLoadSeconds, loginSeconds };
}

/** Main comparison workflow */
export async function compareLoginEducator(driver) {
	console.log("🔬 Login Educator Cache Comparison - Cold vs Warm performance");

	// COLD
	console.log("\n❄️  Login Educator — COLD (no cache)");
	const cold = await performSingleLogin(driver, "COLD");
	const account = getAccountForTest("Login Educator Cache");
	logColdResult("Login Educator (page load)", cold.pageLoadSeconds, account);
	logColdResult("Login Educator (login)", cold.loginSeconds, account);

	// Logout
	await performLogoutEducator(driver);
	await new Promise(r => setTimeout(r, 2000));

	// WARM
	console.log("\n🔥 Login Educator — WARM (cached resources)");
	const warm = await performSingleLogin(driver, "WARM");
	logWarmResult("Login Educator (page load)", warm.pageLoadSeconds, account);
	logWarmResult("Login Educator (login)", warm.loginSeconds, account);

	// Final logout
	await performLogoutEducator(driver);

	// Results summary
	console.log(`\n📊 Login Educator Cache Comparison Results:`);

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

	// Log
	logCacheComparison("Login Educator (page load)", cold.pageLoadSeconds, warm.pageLoadSeconds, account);
	logCacheComparison("Login Educator (login)", cold.loginSeconds, warm.loginSeconds, account);

	// Return warm page load
	return warm.pageLoadSeconds;
}