// openCourseCatalog.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function openCourseCatalog(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to learner URL for Course Catalog test...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Open Course Catalog"));

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

	// --- INITIAL OVERLAY DISMISSAL ---
	await dismissOverlays(driver);

	// Wait for page to stabilize after overlay dismissal (KEY FIX)
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.info("✅ Page stabilized after overlay dismissal");

	// --- OPEN MENU FOR COURSE CATALOG ACCESS ---
	logger.info("🍔 Opening menu for Course Catalog access...");

	// Retry logic for menu button (like openScorm/openVideoProbe)
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding menu button...`);

			// Find element fresh each time - only check visible and stable
			const menuBtn = await waitFor.element(driver, selectorsFor.area9.showMenuButton(), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // Don't check clickability
				errorPrefix: `Show Menu button (attempt ${attempt})`
			});

			// Scroll to center
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", menuBtn);

			// Simple click with JS fallback
			try {
				await menuBtn.click();
				logger.debug(`✅`);
			} catch (clickError) {
				logger.warn(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", menuBtn);
				logger.debug(`✅`);
			}

			logger.info("✅ Menu opened successfully");
			break; // Success, exit retry loop

		} catch (error) {
			if (error.message.includes('stale element')) {
				logger.warn(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click menu button after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	// Wait for menu to fully open (don't verify navigation, just let it settle)
	await waitFor.networkIdle(driver, 500, 3000);

	// --- START TIMER + CLICK COURSE CATALOG ---
	logger.info("📚 Looking for Course Catalog button...");

	// Retry logic for catalog button
	let catalogClicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding Course Catalog button...`);

			const catalogBtn = await waitFor.element(driver, By.xpath("//button[@aria-label='COURSE CATALOG']"), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // Don't check clickability
				errorPrefix: `Course Catalog button (attempt ${attempt})`
			});

			// Scroll to center
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", catalogBtn);

			logger.debug(`🔍 Attempt ${attempt}: Clicking Course Catalog button...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback
			try {
				await catalogBtn.click();
				logger.debug(`✅`);
			} catch (clickError) {
				logger.warn(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", catalogBtn);
				logger.debug(`✅`);
			}

			catalogClicked = true;

			// --- WAIT FOR CATALOG CONTENT TO LOAD ---
			logger.info("📚 Waiting for Course Catalog content to load...");

			// Wait for network activity to settle
			await waitFor.networkIdle(driver, 1500, 10000);

			// Verify catalog content loaded - use the actual HTML structure
			let loaded = false;

			// Strategy 1: Look for nativeWidget divs with images (the actual catalog content)
			try {
				await waitFor.element(driver, By.css('div.nativeWidget img'), {
					timeout: 5000,
					visible: true,
					errorPrefix: 'Catalog content (nativeWidget with image)'
				});
				logger.info("✅ Catalog content detected (nativeWidget structure)");
				loaded = true;
			} catch (error) {
				// Try next strategy
			}

			// Strategy 2: Check URL contains "courses"
			if (!loaded) {
				const url = await driver.getCurrentUrl();
				logger.debug(`🔍 Current URL: ${url}`);
				if (url.includes("courses") || url.includes("#courses")) {
					logger.info("✅ Catalog detected via URL (#courses)");
					loaded = true;
				}
			}

			// Strategy 3: Look for any images (fallback)
			if (!loaded) {
				try {
					const images = await driver.findElements(By.css('img'));
					if (images.length > 0) {
						logger.debug(`✅ via images (${images.length} found)`);
						loaded = true;
					}
				} catch (error) {
					// Continue to error
				}
			}

			if (!loaded) {
				throw new Error("❌ Course Catalog did not load in time - no content detected");
			}

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			logger.info(`⏱ Course Catalog load took: ${seconds}s`);

			await logCurrentState(driver, "Open Course Catalog");
			await pauseForObservation(driver, "Course Catalog content loading", 2);

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
				throw new Error(`❌ Failed to click Course Catalog after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!catalogClicked) {
		throw new Error("❌ Could not click Course Catalog button after all retry attempts");
	}
}
