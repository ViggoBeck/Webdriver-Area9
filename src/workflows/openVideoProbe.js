// openVideoProbe.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function openVideoProbe(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to learner URL for Video Probe test...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Open Video Probe"));

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

	// Wait for learner login to complete
	await waitFor.loginComplete(driver, 'learner', 20000);
	logger.info("✅ Login completed, dashboard loaded");

	// --- DISMISS OVERLAY ---
	await dismissOverlays(driver);

	// Wait for page to stabilize after overlay dismissal (KEY FIX from openScorm)
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.info("✅ Page stabilized after overlay dismissal");

	// --- LOCATE AND CLICK VIDEO BENCHMARK CARD ---
	logger.info("🔍 Looking for Video Benchmark Test card...");

	const videoCardXPath = `
		//p[normalize-space()='1 Video Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Video' and not(@disabled)]
	`;

	// Retry logic with fresh element lookup (like openScorm)
	let clicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding Video card button...`);

			// Find element fresh each time - only check visible and stable (NOT clickable)
			const videoBtn = await waitFor.element(driver, By.xpath(videoCardXPath), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // Don't check clickability - just like openScorm
				errorPrefix: `Video Benchmark card button (attempt ${attempt})`
			});

			// Scroll to center (like openScorm)
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", videoBtn);
			logger.info(`✅ Scrolled to Video card`);

			logger.debug(`🔍 Attempt ${attempt}: Clicking Video card...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback (like openScorm)
			try {
				await videoBtn.click();
				logger.debug(`✅`);
			} catch (clickError) {
				logger.warn(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", videoBtn);
				logger.debug(`✅`);
			}

			clicked = true;

			// --- WAIT FOR VIDEO CONTENT TO LOAD ---
			logger.info("⏳ Waiting for video content to load...");

			// First, wait for navigation/page change
			await waitFor.networkIdle(driver, 1500, 8000);

			// Check for video player elements
			let videoLoaded = false;

			try {
				// Try to find video/iframe elements
				await waitFor.element(driver, By.css("video, iframe, embed, object"), {
					timeout: 10000,
					visible: true,
					errorPrefix: 'Video player element'
				});
				videoLoaded = true;
				logger.info("✅ Video player detected");
			} catch (error) {
				// Fallback: check URL change
				const url = await driver.getCurrentUrl();
				if (url.includes("card=")) {
					videoLoaded = true;
					logger.info("✅ Video detected via URL change");
				}
			}

			if (!videoLoaded) {
				throw new Error("Video probe content did not load in time");
			}

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			logger.info(`⏱ Video probe load took: ${seconds}s`);

			await logCurrentState(driver, "Open Video Probe");
			await pauseForObservation(driver, "Video probe content loading", 3);

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
				throw new Error(`❌ Failed to click Video card after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!clicked) {
		throw new Error("❌ Could not click Video card after all retry attempts");
	}
}
