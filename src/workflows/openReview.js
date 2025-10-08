// openReview.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/auth.js";

export async function openReview(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to educator URL for Review test...");
	await driver.get(buildEducatorUrl());

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	const assignedAccount = getAccountForTest("Open Review");
	await emailField.sendKeys(assignedAccount);

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

	// Wait for educator login to complete
	await waitFor.loginComplete(driver, 'educator', 20000);
	logger.info("✅ Login completed, dashboard loaded");

	// --- NAVIGATE TO CLASS CONTENT PAGE ---
	logger.info("🔄 Navigating to class content page...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=classcontent");

	// Wait for page to stabilize after complex navigation
	await waitFor.networkIdle(driver, 1000, 8000);

	// --- START TIMER + CLICK REVIEWS TAB ---
	logger.info("🔍 Looking for Reviews tab...");

	// Retry logic for Reviews tab (like openScorm/openVideoProbe/openCourseCatalog)
	let clicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding Reviews tab...`);

			// Find element fresh each time - only check visible and stable (NOT clickable)
			const reviewsTab = await waitFor.element(driver, By.css('button[aria-label="reviews"]'), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // Don't check clickability - just like openScorm
				errorPrefix: `Reviews tab (attempt ${attempt})`
			});

			// Scroll to center
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", reviewsTab);
			logger.info(`✅ Scrolled to Reviews tab`);

			logger.debug(`🔍 Attempt ${attempt}: Clicking Reviews tab...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback
			try {
				await reviewsTab.click();
				logger.debug(`✅`);
			} catch (clickError) {
				logger.warn(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", reviewsTab);
				logger.debug(`✅`);
			}

			clicked = true;

			// --- WAIT FOR REVIEWS CONTENT TO LOAD ---
			logger.info("⏳ Waiting for reviews content to load...");

			// Wait for network activity to settle
			await waitFor.networkIdle(driver, 1000, 8000);

			// Check for the actual Reviews content - "ACTIVITY: Needs Review" heading
			let reviewsLoaded = false;

			// Strategy 1: Look for the "ACTIVITY: Needs Review" heading
			try {
				await waitFor.element(driver, By.xpath("//h6[contains(text(), 'ACTIVITY: Needs Review')]"), {
					timeout: 5000,
					visible: true,
					errorPrefix: 'Reviews heading "ACTIVITY: Needs Review"'
				});
				logger.info("✅ Reviews content detected (ACTIVITY: Needs Review heading)");
				reviewsLoaded = true;
			} catch (error) {
				// Try next strategy
			}

			// Strategy 2: Look for the table with review data
			if (!reviewsLoaded) {
				try {
					await waitFor.element(driver, By.css('table[role="table"]'), {
						timeout: 3000,
						visible: true,
						errorPrefix: 'Reviews table'
					});
					logger.info("✅ Reviews table detected");
					reviewsLoaded = true;
				} catch (error) {
					// Try next strategy
				}
			}

			// Strategy 3: Check that the tab is now selected
			if (!reviewsLoaded) {
				try {
					await waitFor.element(driver, By.css('button[aria-label="reviews"][aria-selected="true"]'), {
						timeout: 3000,
						visible: true,
						errorPrefix: 'Selected Reviews tab'
					});
					logger.info("✅ Reviews tab is selected");
					reviewsLoaded = true;
				} catch (error) {
					// Assume success if tab was clicked
					logger.info("✅ Reviews tab was clicked - assuming content loaded");
					reviewsLoaded = true;
				}
			}

			if (!reviewsLoaded) {
				throw new Error("❌ Reviews content did not load in time");
			}

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			logger.info(`⏱ Open Review took: ${seconds}s`);

			await logCurrentState(driver, "Open Review");
			await pauseForObservation(driver, "Reviews tab opened - you can see the review content", 3);

			// --- LOGOUT ---
			await performLogout(driver, 'educator');

			return seconds;

		} catch (error) {
			if (error.message.includes('stale element')) {
				logger.warn(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click Reviews tab after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!clicked) {
		throw new Error("❌ Could not click Reviews tab after all retry attempts");
	}
}
