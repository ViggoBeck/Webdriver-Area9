// openScorm.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { buildLearnerUrl } from "../utils/config.js";

export async function openScorm(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to learner URL for SCORM test...");
	await driver.get(buildLearnerUrl());

	// Debug: Check current state
	try {
		const currentUrl = await driver.getCurrentUrl();
		const pageTitle = await driver.getTitle();
		logger.info(`📍 Current URL: ${currentUrl}`);
		logger.info(`📄 Page title: ${pageTitle}`);
	} catch (e) {
		logger.info("⚠️ Could not get page info");
	}

	// Look for login form with better error handling
	logger.info("🔍 Looking for login form...");
	let needsLogin = false;
	try {
		const emailField = await waitFor.element(driver, By.css('input[name="username"]'), {
			timeout: 10000,
			visible: true,
			errorPrefix: 'Username field'
		});
		logger.info("✅ Login form found, proceeding with login...");
		await emailField.sendKeys(getAccountForTest("Open SCORM"));
		needsLogin = true;
	} catch (error) {
		// Enhanced error handling - check if we're already logged in
		logger.info("⚠️ Login form not found, checking if already logged in...");

		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		const dashboardElements = await driver.findElements(By.xpath("//*[text()='LEARN' or text()='TO-DO']"));

		logger.debug(`📊 Login forms found: ${loginForms.length}`);
		logger.debug(`📊 Dashboard elements found: ${dashboardElements.length}`);

		if (dashboardElements.length > 0) {
			logger.info("✅ Already logged in, skipping login process...");
			// Already on dashboard, continue with SCORM card clicking
		} else {
			// Force navigation back to login
			logger.info("🔄 Forcing fresh navigation to login page...");
			await driver.get(buildLearnerUrl());

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
			logger.info("✅ Login completed, dashboard loaded");
		}
	}

	// Complete login if we found the login form initially
	if (needsLogin) {
		logger.info("🔐 Completing login process...");
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
		logger.info("✅ Login completed, dashboard loaded");
	}

	// Ensure we're on dashboard (whether we just logged in or were already logged in)
	logger.info("🔍 Verifying dashboard is loaded...");
	try {
		await waitFor.element(driver, By.xpath("//*[text()='LEARN' or text()='TO-DO']"), {
			timeout: 10000,
			visible: true,
			errorPrefix: 'Dashboard verification'
		});
		logger.info("✅ Dashboard confirmed loaded");
	} catch (e) {
		logger.info("⚠️ Dashboard verification failed, but continuing...");
	}

	// --- DISMISS OVERLAY USING SHARED FUNCTION ---
	await dismissOverlays(driver);

	// Wait for page to stabilize after overlay dismissal
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.info("✅ Page stabilized after overlay dismissal");

	// --- SCORM CARD ---
	logger.info("🔍 Looking for SCORM Benchmark Test card...");
	const scormCardXPath = `
		//p[normalize-space()='1 Scorm Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Scorm' and not(@disabled)]
	`;

	// Retry logic with fresh element lookup and simple click approach (like original)
	let clicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding SCORM card button...`);

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
			logger.info(`✅ Scrolled to SCORM card`);

			logger.debug(`🔍 Attempt ${attempt}: Clicking SCORM card...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback (like original code)
			try {
				await scormBtn.click();
				logger.debug(`✅`);
			} catch (clickError) {
				logger.warn(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", scormBtn);
				logger.debug(`✅`);
			}

			clicked = true;

			// --- WAIT FOR SCORM PLAYER ---
			logger.info("⏳ Waiting for SCORM content to load...");

			let scormLoaded = false;
			try {
				await waitFor.element(driver, By.css("iframe, embed, object"), {
					timeout: 15000,
					visible: true,
					errorPrefix: 'SCORM player element'
				});
				scormLoaded = true;
				logger.info("✅ SCORM player detected via iframe/embed");
			} catch {}

			if (!scormLoaded) {
				const url = await driver.getCurrentUrl();
				if (url.includes("card=")) {
					scormLoaded = true;
					logger.info("✅ SCORM detected via URL change");
				}
			}

			if (!scormLoaded) throw new Error("❌ SCORM did not load in time");

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			logger.info(`⏱ SCORM load took: ${seconds}s`);

			await logCurrentState(driver, "Open SCORM");
			await pauseForObservation(driver, "SCORM content loading", 3);

			// Perform logout after test completion
			await performLogout(driver, 'learner');

			return seconds;

		} catch (error) {
			if (error.message.includes('stale element')) {
				logger.warn(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click SCORM card after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!clicked) {
		throw new Error("❌ Could not click SCORM card after all retry attempts");
	}
}
