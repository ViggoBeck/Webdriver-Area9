// src/workflowsCache/compareLoginCurator.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { buildCuratorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
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

/** Logout handling for curator */
async function performLogoutCurator(driver) {
	console.log("🔄 Starting curator logout...");

	try {
		// Open menu
		const menuBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
			DEFAULT_TIMEOUT
		);
		await driver.executeScript("arguments[0].click();", menuBtn);
		console.log("✅ Menu opened");
		await new Promise(r => setTimeout(r, 1000));

		// Click logout (aria-label="LOGOUT" or visible text)
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
		console.log("⚠️ Logout failed, fallback to learner login");
		await driver.get(buildCuratorUrl().replace("curator.html", "learner.html").split("?")[0]);
		await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	}
}

/** One login attempt with:
 *  - page load (cold/warm)
 *  - login timing
 */
async function performSingleLogin(driver, loginType) {
	console.log(`🎯 Performing ${loginType} curator login...`);

	// --- PAGE LOAD TIMING ---
	const pageLoadStart = Date.now();
	await driver.get(buildCuratorUrl());
	await new Promise(r => setTimeout(r, 1500)); // allow UI scripts to render

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		DEFAULT_TIMEOUT
	);
	const pageLoadSeconds = Number(((Date.now() - pageLoadStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} page load took: ${pageLoadSeconds}s`);

	// Fill login form
	await emailField.sendKeys(getAccountForTest("Login Curator"));
	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);
	const signInButton = await driver.findElement(By.id("sign_in"));

	// --- LOGIN TIMING ---
	const loginStart = Date.now();
	await signInButton.click();

	const successSelectors = [
		By.xpath("//*[text()='Dashboard']"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//*[contains(@class, 'dashboard')]"),
		By.xpath("//*[contains(@class, 'main-content')]"),
		By.xpath("//*[contains(@class, 'app-content')]"),
		By.xpath("//nav | //header | //*[@role='navigation']"),
		By.xpath("//*[contains(text(), 'Analytics') or contains(text(), 'Reports') or contains(text(), 'Users')]")
	];

	let loginSuccess = false;
	for (const selector of successSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 5000);
			console.log(`✅ ${loginType} curator login success via: ${selector}`);
			loginSuccess = true;
			break;
		} catch {}
	}

	if (!loginSuccess) {
		await new Promise(r => setTimeout(r, 2000));
		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		if (loginForms.length === 0) {
			console.log(`✅ Login form disappeared - ${loginType} curator login successful`);
			loginSuccess = true;
		}
	}

	if (!loginSuccess) throw new Error(`❌ Could not verify ${loginType} curator login success`);

	const loginSeconds = Number(((Date.now() - loginStart) / 1000).toFixed(3));
	console.log(`⏱ ${loginType} login took: ${loginSeconds}s`);

	// Cleanup
	await dismissOverlay(driver);
	await logCurrentState(driver, "Login Curator Cache");
	await pauseForObservation(driver, `${loginType} curator login completed`, 1);

	return { pageLoadSeconds, loginSeconds };
}

/** Main comparison workflow */
export async function compareLoginCurator(driver) {
	console.log("🔬 Login Curator Cache Comparison - Cold vs Warm performance");

	// COLD
	console.log("\n❄️  Login Curator — COLD (no cache)");
	const cold = await performSingleLogin(driver, "COLD");
	const account = getAccountForTest("Login Curator Cache");
	logColdResult("Login Curator (page load)", cold.pageLoadSeconds, account);
	logColdResult("Login Curator (login)", cold.loginSeconds, account);

	// Logout
	await performLogoutCurator(driver);
	await new Promise(r => setTimeout(r, 2000));

	// WARM
	console.log("\n🔥 Login Curator — WARM (cached resources)");
	const warm = await performSingleLogin(driver, "WARM");
	logWarmResult("Login Curator (page load)", warm.pageLoadSeconds, account);
	logWarmResult("Login Curator (login)", warm.loginSeconds, account);

	// Final logout
	await performLogoutCurator(driver);

	// Results summary
	console.log(`\n📊 Login Curator Cache Comparison Results:`);

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
	logCacheComparison("Login Curator (page load)", cold.pageLoadSeconds, warm.pageLoadSeconds, account);
	logCacheComparison("Login Curator (login)", cold.loginSeconds, warm.loginSeconds, account);

	// Return warm page load
	return warm.pageLoadSeconds;
}