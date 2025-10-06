// communicator.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

async function waitForCommunicatorUI(driver, timeout = 15000) {
	console.log("⏳ Waiting for Communicator UI to load...");

	// Look for communicator-specific elements with multiple strategies
	const communicatorSelectors = [
		By.xpath("//*[contains(@class, 'communication')]"),
		By.xpath("//*[contains(@class, 'communicator')]"),
		By.xpath("//*[contains(text(), 'Inbox')]"),
		By.xpath("//*[contains(text(), 'Messages')]"),
		By.xpath("//*[contains(text(), 'Communication')]"),
		By.xpath("//*[contains(@class, 'message')]")
	];

	// Wait for network idle first (page transition)
	await waitFor.networkIdle(driver, 1500, 10000);

	// Try to find communicator UI with fallback selectors
	const communicatorElement = await waitFor.elementWithFallbacks(driver, communicatorSelectors, {
		timeout,
		visible: true,
		errorPrefix: 'Communicator UI'
	});

	console.log("✅ Communicator UI loaded");
	return communicatorElement;
}

export async function communicatorLearner(driver) {
	// Use direct communicator URL during login
	console.log("🌐 Navigating to learner communicator URL...");
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
	console.log("🚀 Starting timer - clicking login...");
	const start = Date.now();

	await waitFor.smartClick(driver, signInButton);

	// Wait for communicator UI to load directly
	await waitForCommunicatorUI(driver);

	// STOP TIMER
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ Communicator Learner took: ${seconds}s`);

	// Handle overlay dismissal and logout after timing is complete
	await logCurrentState(driver, "Communicator Learner");
	await pauseForObservation(driver, "Communicator UI loaded", 2);

	// Dismiss any onboarding overlays
	await dismissOverlays(driver);

	// Perform logout
	await performLogout(driver, 'learner');

	return seconds;
}

export async function communicatorEducator(driver) {
	// Use direct communicator URL during login
	console.log("🌐 Navigating to educator communicator URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication");

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	const assignedAccount = getAccountForTest("Communicator Educator");
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
	console.log("🚀 Starting timer - clicking login...");
	const start = Date.now();

	await waitFor.smartClick(driver, signInButton);

	// Wait for communicator UI to load directly
	await waitForCommunicatorUI(driver);

	// STOP TIMER
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ Communicator Educator took: ${seconds}s`);

	await logCurrentState(driver, "Communicator Educator");
	await pauseForObservation(driver, "Communicator UI loaded", 2);

	return seconds;
}
