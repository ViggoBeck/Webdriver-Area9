import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";
import { logResult } from "../utils/log.js";

// Single SCORM card click measurement (assumes already on dashboard)
async function clickScormCard(driver) {
	console.log("🎯 Measuring SCORM card click to load...");

	// Find SCORM card
	const scormCardXPath = `
		//p[normalize-space()='1 Scorm Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Scorm' and not(@disabled)]
	`;

	let scormBtn;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			scormBtn = await driver.wait(until.elementLocated(By.xpath(scormCardXPath)), DEFAULT_TIMEOUT);
			await driver.wait(until.elementIsVisible(scormBtn), 5000);
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", scormBtn);
			break;
		} catch {
			if (attempt === 3) throw new Error("Could not find SCORM card");
			await new Promise(r => setTimeout(r, 2000));
		}
	}

	// START TIMER: Right before clicking SCORM card
	const start = Date.now();

	// Click SCORM card
	try {
		await scormBtn.click();
	} catch {
		await driver.executeScript("arguments[0].click();", scormBtn);
	}

	// Wait for SCORM content to load
	let scormLoaded = false;
	try {
		await driver.wait(until.elementLocated(By.css("iframe, embed, object")), DEFAULT_TIMEOUT);
		scormLoaded = true;
	} catch {}

	if (!scormLoaded) {
		const url = await driver.getCurrentUrl();
		if (url.includes("card=")) scormLoaded = true;
	}

	if (!scormLoaded) throw new Error("SCORM did not load in time");

	// STOP TIMER
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ SCORM click-to-load: ${seconds}s`);

	await logCurrentState(driver, "SCORM Click");
	await pauseForObservation(driver, "SCORM content loaded", 1);

	return seconds;
}

export async function compareScorm(driver) {
	console.log("🔬 SCORM Cache Comparison - Cold vs Warm in same session");

	// === ONE-TIME SETUP ===
	console.log("🌐 Navigating to learner URL...");
	await driver.get(buildLearnerUrl());
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Login once
	console.log("🔐 Performing one-time login...");
	let needsLogin = false;
	try {
		const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
		await emailField.sendKeys(getAccountForTest("Open SCORM"));
		needsLogin = true;
	} catch (error) {
		// Check if already logged in
		const dashboardElements = await driver.findElements(By.xpath("//*[text()='LEARN' or text()='TO-DO']"));
		if (dashboardElements.length > 0) {
			console.log("✅ Already logged in, skipping login process...");
		} else {
			throw new Error("Could not find login form or dashboard");
		}
	}

	if (needsLogin) {
		const passwordField = await driver.findElement(By.css('input[name="password"]'));
		await passwordField.sendKeys(DEFAULT_PASSWORD);

		const signInBtn = await driver.findElement(By.id("sign_in"));
		await signInBtn.click();
		await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

		// Wait for dashboard
		await driver.wait(
			until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
			DEFAULT_TIMEOUT
		);
	}

	console.log("✅ Dashboard loaded");

	// Dismiss overlays once
	await dismissLearnerOverlay(driver);

	// === COLD/WARM COMPARISON ===

	// COLD: First SCORM click
	console.log("\n❄️  SCORM — COLD (first click)");
	const cold = await clickScormCard(driver);
	logResult("Open SCORM (cold)", cold);

	// Click "Back to Dashboard" button for warm test
	console.log("🔄 Clicking Back to Dashboard button...");

	let backBtn;
	try {
		// Find the Back to Dashboard button
		backBtn = await driver.wait(
			until.elementLocated(By.css('button[aria-label="Back to Dashboard"]')),
			10000
		);
		await driver.wait(until.elementIsVisible(backBtn), 5000);
		await driver.executeScript("arguments[0].click();", backBtn);
		console.log("✅ Back to Dashboard button clicked");
	} catch (e) {
		console.log("⚠️ Back to Dashboard button not found, using fallback navigation...");
		await driver.get(buildLearnerUrl());
	}

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
		DEFAULT_TIMEOUT
	);
	console.log("✅ Dashboard loaded for warm test");

	// Small pause to let page settle
	await new Promise(r => setTimeout(r, 2000));

	// WARM: Second SCORM click (benefits from cache)
	console.log("\n🔥 SCORM — WARM (second click, cached)");
	const warm = await clickScormCard(driver);
	logResult("Open SCORM (warm)", warm);

	// === CLEANUP ===
	await performLearnerLogout(driver);

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	console.log(`\n📊 SCORM Cache Comparison Results:`);
	console.log(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	console.log(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	console.log(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result (since cache tests are about optimization)
	return warm;
}