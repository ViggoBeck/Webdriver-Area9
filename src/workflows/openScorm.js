// openScorm.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function openScorm(driver) {
	// --- LOGIN (not timed) ---
	console.log("🌐 Navigating to learner URL for SCORM test...");
	await driver.get(buildLearnerUrl());

	// Wait for page to fully load (includes network idle internally)
	await waitFor.pageLoad(driver);

	// Debug: Check current state
	try {
		const currentUrl = await driver.getCurrentUrl();
		const pageTitle = await driver.getTitle();
		console.log(`📍 Current URL: ${currentUrl}`);
		console.log(`📄 Page title: ${pageTitle}`);
	} catch (e) {
		console.log("⚠️ Could not get page info");
	}

	// Look for login form with better error handling
	console.log("🔍 Looking for login form...");
	let needsLogin = false;
	try {
		const emailField = await waitFor.element(driver, By.css('input[name="username"]'), {
			timeout: 10000,
			visible: true,
			errorPrefix: 'Username field'
		});
		console.log("✅ Login form found, proceeding with login...");
		await emailField.sendKeys(getAccountForTest("Open SCORM"));
		needsLogin = true;
	} catch (error) {
		// Enhanced error handling - check if we're already logged in
		console.log("⚠️ Login form not found, checking if already logged in...");

		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		const dashboardElements = await driver.findElements(By.xpath("//*[text()='LEARN' or text()='TO-DO']"));

		console.log(`📊 Login forms found: ${loginForms.length}`);
		console.log(`📊 Dashboard elements found: ${dashboardElements.length}`);

		if (dashboardElements.length > 0) {
			console.log("✅ Already logged in, skipping login process...");
			// Already on dashboard, continue with SCORM card clicking
		} else {
			// Force navigation back to login
			console.log("🔄 Forcing fresh navigation to login page...");
			await driver.get(buildLearnerUrl());
			await waitFor.pageLoad(driver);

			const emailField = await waitFor.element(driver, By.css('input[name="username"]'), {
				timeout: 10000,
				visible: true,
				errorPrefix: 'Username field (retry)'
			});
			await emailField.sendKeys(getAccountForTest("Open SCORM"));

			// Complete login process
			const passwordField = await waitFor.element(driver, By.css('input[name="password"]'), {
				visible: true,
				errorPrefix: 'Password field'
			});
			await passwordField.sendKeys(DEFAULT_PASSWORD);

			const signInBtn = await waitFor.element(driver, By.id("sign_in"), {
				clickable: true,
				errorPrefix: 'Sign in button'
			});
			await waitFor.smartClick(driver, signInBtn);

			await driver.wait(until.stalenessOf(signInBtn), 15000).catch(() => {});

			// Wait for dashboard
			await waitFor.element(driver, By.xpath("//*[text()='LEARN' or text()='TO-DO']"), {
				timeout: 15000,
				visible: true,
				errorPrefix: 'Dashboard indicator'
			});
			console.log("✅ Login completed, dashboard loaded");
		}
	}

	// Complete login if we found the login form initially
	if (needsLogin) {
		console.log("🔐 Completing login process...");
		const passwordField = await waitFor.element(driver, By.css('input[name="password"]'), {
			visible: true,
			errorPrefix: 'Password field'
		});
		await passwordField.sendKeys(DEFAULT_PASSWORD);

		const signInBtn = await waitFor.element(driver, By.id("sign_in"), {
			clickable: true,
			errorPrefix: 'Sign in button'
		});
		await waitFor.smartClick(driver, signInBtn);

		await driver.wait(until.stalenessOf(signInBtn), 15000).catch(() => {});

		// Wait for dashboard
		await waitFor.element(driver, By.xpath("//*[text()='LEARN' or text()='TO-DO']"), {
			timeout: 15000,
			visible: true,
			errorPrefix: 'Dashboard indicator'
		});
		console.log("✅ Login completed, dashboard loaded");
	}

	// Ensure we're on dashboard (whether we just logged in or were already logged in)
	console.log("🔍 Verifying dashboard is loaded...");
	try {
		await waitFor.element(driver, By.xpath("//*[text()='LEARN' or text()='TO-DO']"), {
			timeout: 10000,
			visible: true,
			errorPrefix: 'Dashboard verification'
		});
		console.log("✅ Dashboard confirmed loaded");
	} catch (e) {
		console.log("⚠️ Dashboard verification failed, but continuing...");
	}

	// --- DISMISS OVERLAY USING SHARED FUNCTION ---
	await dismissLearnerOverlay(driver);

	// Wait for page to stabilize after overlay dismissal
	await waitFor.networkIdle(driver, 1000, 5000);
	console.log("✅ Page stabilized after overlay dismissal");

	// --- SCORM CARD ---
	console.log("🔍 Looking for SCORM Benchmark Test card...");
	const scormCardXPath = `
		//p[normalize-space()='1 Scorm Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Scorm' and not(@disabled)]
	`;

	// Retry logic with fresh element lookup and simple click approach (like original)
	let clicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			console.log(`🔍 Attempt ${attempt}: Finding SCORM card button...`);

			// Find element fresh each time - only check visible and stable (not clickable)
			const scormBtn = await waitFor.element(driver, By.xpath(scormCardXPath), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // Don't check clickability - just like original code
				errorPrefix: `SCORM card button (attempt ${attempt})`
			});

			// Scroll to center (like original code)
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", scormBtn);
			console.log(`✅ Scrolled to SCORM card`);

			console.log(`🔍 Attempt ${attempt}: Clicking SCORM card...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback (like original code)
			try {
				await scormBtn.click();
				console.log(`✅ Regular click succeeded`);
			} catch (clickError) {
				console.log(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", scormBtn);
				console.log(`✅ JS click succeeded`);
			}

			clicked = true;

			// --- WAIT FOR SCORM PLAYER ---
			console.log("⏳ Waiting for SCORM content to load...");

			let scormLoaded = false;
			try {
				await waitFor.element(driver, By.css("iframe, embed, object"), {
					timeout: 15000,
					visible: true,
					errorPrefix: 'SCORM player element'
				});
				scormLoaded = true;
				console.log("✅ SCORM player detected via iframe/embed");
			} catch {}

			if (!scormLoaded) {
				const url = await driver.getCurrentUrl();
				if (url.includes("card=")) {
					scormLoaded = true;
					console.log("✅ SCORM detected via URL change");
				}
			}

			if (!scormLoaded) throw new Error("❌ SCORM did not load in time");

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			console.log(`⏱ SCORM load took: ${seconds}s`);

			await logCurrentState(driver, "Open SCORM");
			await pauseForObservation(driver, "SCORM content loading", 3);

			// Perform logout after test completion
			await performLearnerLogout(driver);

			return seconds;

		} catch (error) {
			if (error.message.includes('stale element')) {
				console.log(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click SCORM card after ${attempt} attempts: ${error.message}`);
			}

			console.log(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!clicked) {
		throw new Error("❌ Could not click SCORM card after all retry attempts");
	}
}
