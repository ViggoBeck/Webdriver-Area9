// openClass.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/auth.js";

export async function openClass(driver) {
	logger.info("🚀 Starting Open Class test...");

	// --- LOGIN AS EDUCATOR (not timed) ---
	await driver.get(buildEducatorUrl());

	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Open Class"));

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

	// Wait for login to complete with intelligent detection
	await waitFor.loginComplete(driver, 'educator', 20000);
	logger.info("✅ Logged in as Educator");

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotItButton = await waitFor.element(driver, selectorsFor.area9.gotItButton(), {
			timeout: 3000,
			visible: true,
			errorPrefix: 'Got It overlay button'
		});
		await waitFor.smartClick(driver, gotItButton);
		logger.info("✅ Overlay dismissed");
	} catch (error) {
		logger.info("ℹ️ No overlay to dismiss");
	}

	// --- LOCATE "Benchmark Test 1 Do not touch" CLASS ---
	logger.info("🔍 Looking for 'Benchmark Test 1 Do not touch' class...");

	// Single robust selector - no more fallback chains
	const classElement = await waitFor.element(driver, selectorsFor.area9.classRow('Benchmark Test 1 Do not touch'), {
		timeout: 12000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Benchmark Test 1 class'
	});

	logger.info("✅ Found 'Benchmark Test 1 Do not touch' class");

	// --- START TIMER + CLICK CLASS ---
	logger.info("🚀 Starting timer - clicking class...");
	const start = Date.now();

	await waitFor.smartClick(driver, classElement);
	logger.info("✅ Clicked 'Benchmark Test 1 Do not touch' class");

	// --- WAIT FOR CLASS CONTENT TO LOAD ---
	logger.info("⏳ Waiting for class content to fully load...");

	// Application-specific completion detection
	await waitFor.classContent(driver, 15000);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Class open took: ${seconds}s`);

	await logCurrentState(driver, "Open Class");
	await pauseForObservation(driver, "Class opened - viewing class content", 3);

	// --- LOGOUT ---
	await performLogout(driver, 'educator');

	logger.info("✨ Open Class test finished");
	return seconds;
}
