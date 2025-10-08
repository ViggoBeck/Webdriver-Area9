// communicatorLearner.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function communicatorLearner(driver) {
	// Use direct communicator URL during login
	logger.info("🌐 Navigating to learner communicator URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]");

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	const assignedAccount = getAccountForTest("Communicator Learner");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// START TIMING: Right before clicking login (as per specification)
	logger.info("🚀 Starting timer - clicking login...");
	const start = Date.now();

	await waitFor.smartClick(driver, signInButton);

	// --- WAIT FOR COMMUNICATOR UI TO LOAD ---
	logger.info("⏳ Waiting for Communicator UI to load...");

	// Don't wait for full network idle - just check for UI elements directly
	// This is faster and more reliable

	let communicatorLoaded = false;

	// Strategy 1: Look for "Inbox" folder (appears fastest based on logs)
	try {
		await waitFor.element(driver, By.xpath("//p[contains(text(), 'Inbox')]"), {
			timeout: 15000,
			visible: true,
			errorPrefix: 'Communicator Inbox folder'
		});
		logger.info("✅ Communicator UI detected (Inbox folder found)");
		communicatorLoaded = true;
	} catch (error) {
		// Try next strategy
	}

	// Strategy 2: Look for "MAIL" heading
	if (!communicatorLoaded) {
		try {
			await waitFor.element(driver, By.xpath("//p[contains(text(), 'MAIL')]"), {
				timeout: 5000,
				visible: true,
				errorPrefix: 'Communicator MAIL heading'
			});
			logger.info("✅ Communicator UI detected (MAIL heading found)");
			communicatorLoaded = true;
		} catch (error) {
			// Try next strategy
		}
	}

	// Strategy 3: Check URL contains communication
	if (!communicatorLoaded) {
		const url = await driver.getCurrentUrl();
		logger.debug(`🔍 Current URL: ${url}`);
		if (url.includes("communication") || url.includes("#communication")) {
			logger.info("✅ Communicator detected via URL");
			communicatorLoaded = true;
		}
	}

	if (!communicatorLoaded) {
		throw new Error("❌ Communicator UI did not load in time");
	}

	// STOP TIMER
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	logger.info(`⏱ Communicator Learner took: ${seconds}s`);

	await logCurrentState(driver, "Communicator Learner");
	await pauseForObservation(driver, "Communicator UI loaded", 2);

	// Dismiss any onboarding overlays
	await dismissOverlays(driver);

	// Perform logout
	await performLogout(driver, 'learner');

	return seconds;
}
