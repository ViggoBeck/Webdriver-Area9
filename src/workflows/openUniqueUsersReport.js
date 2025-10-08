// openUniqueUsersReport.js - Simplified pattern matching proven old script
// Uses simple waits and JS clicks to avoid timing issues

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/auth.js";

export async function openUniqueUsersReport(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to curator URL for Unique Users Report...");
	await driver.get(buildCuratorUrl());

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});

	await emailField.sendKeys(getAccountForTest("Open Unique Users Report"));

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		timeout: 5000,
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		timeout: 5000,
		visible: true,
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	await waitFor.smartClick(driver, signInBtn);

	// Wait for curator login to complete
	await waitFor.loginComplete(driver, 'curator', 20000);
	logger.info("✅ Login completed, dashboard loaded");

	// --- OPEN MENU / ANALYTICS ---
	logger.info("📂 Opening menu for Analytics access...");

	// Try to find Analytics button (might already be visible if menu is open)
	let analyticsBtn;
	try {
		// First try to find menu button and click it
		const menuBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
			5000
		);
		await driver.executeScript("arguments[0].click();", menuBtn);
		logger.info("✅ Menu opened");

		// Wait for menu animation to complete
		await new Promise(resolve => setTimeout(resolve, 300));

		// Now find Analytics button
		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			5000
		);
	} catch (error) {
		// Menu might already be open, try to find Analytics directly
		logger.info("⚠️ Menu button not found, checking if Analytics is already visible...");
		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			5000
		);
	}

	// Scroll and click Analytics button (always use JS click to avoid interception)
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", analyticsBtn);
	await driver.executeScript("arguments[0].click();", analyticsBtn);
	logger.info("✅ Analytics section opened");

	// --- LOCATE AND CLICK UNIQUE USERS CARD ---
	logger.info("🔍 Looking for Unique Users card...");

	const uniqueUsersCard = await driver.wait(
		until.elementLocated(By.xpath("//p[normalize-space()='UNIQUE USERS']/ancestor::div[contains(@class,'nativeWidget')]")),
		10000
	);

	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", uniqueUsersCard);

	// Wait for UI to settle after scroll
	await new Promise(resolve => setTimeout(resolve, 300));

	// --- START TIMER + CLICK ---
	const start = Date.now();
	logger.info("⏱️ Starting timer and clicking Unique Users card...");

	try {
		await uniqueUsersCard.click();
		logger.info("✅ Regular click succeeded");
	} catch (clickError) {
		logger.info("⚠️ Regular click failed, using JS click");
		await driver.executeScript("arguments[0].click();", uniqueUsersCard);
		logger.info("✅ JS click succeeded");
	}

	// --- WAIT FOR REPORT TO LOAD ---
	logger.info("⏳ Waiting for Unique Users report to load...");

	// Wait for network idle (report data loading)
	await waitFor.networkIdle(driver, 1000, 10000);

	// Verify report loaded via URL
	const url = await driver.getCurrentUrl();
	logger.info(`📍 Current URL: ${url}`);

	if (url.includes('reports') || url.includes('dashboard')) {
		logger.info("✅ Report detected via URL");
	} else {
		throw new Error("❌ Unique Users Report did not load - URL check failed");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Unique Users Report load took: ${seconds}s`);

	await logCurrentState(driver, "Open Unique Users Report");
	await pauseForObservation(driver, "Unique Users Report content");

	// --- LOGOUT ---
	await performLogout(driver, 'curator');

	return seconds;
}
