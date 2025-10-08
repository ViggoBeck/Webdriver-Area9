// OpenProjectTeam.js - Simplified pattern matching proven openUniqueUsersReport
// Uses simple waits and JS clicks to avoid timing issues

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/auth.js";

export async function openProjectTeamActivity(driver) {
	// --- LOGIN (not timed) ---
	logger.info("🌐 Navigating to curator URL for Project Team Activity...");
	await driver.get(buildCuratorUrl());

	// Smart login with automatic detection and completion
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});

	await emailField.sendKeys(getAccountForTest("Open Project Team Activity"));

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

	// --- LOCATE AND CLICK PROJECT TEAM ACTIVITY CARD ---
	logger.info("🔍 Looking for Project Team Activity card...");

	// Use specific selector to find PROJECT TEAM ACTIVITY card (not UNIQUE USERS)
	const projectTeamCard = await driver.wait(
		until.elementLocated(By.xpath("//p[normalize-space()='PROJECT TEAM ACTIVITY' and contains(@style,'font-size: 30px')]/ancestor::div[contains(@style,'cursor: pointer')]")),
		10000
	);

	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", projectTeamCard);

	// Wait for UI to settle after scroll
	await new Promise(resolve => setTimeout(resolve, 300));

	// --- START TIMER + CLICK ---
	const start = Date.now();
	logger.info("⏱️ Starting timer and clicking Project Team Activity card...");

	try {
		await projectTeamCard.click();
		logger.info("✅ Regular click succeeded");
	} catch (clickError) {
		logger.info("⚠️ Regular click failed, using JS click");
		await driver.executeScript("arguments[0].click();", projectTeamCard);
		logger.info("✅ JS click succeeded");
	}

	// --- WAIT FOR REPORT TO LOAD ---
	logger.info("⏳ Waiting for Project Team Activity report to load...");

	// Wait for network idle (report data loading)
	await waitFor.networkIdle(driver, 1000, 10000);

	// Verify report loaded via URL
	const url = await driver.getCurrentUrl();
	logger.info(`📍 Current URL: ${url}`);

	if (url.includes('reports') || url.includes('dashboard') || url.includes('project')) {
		logger.info("✅ Report detected via URL");
	} else {
		throw new Error("❌ Project Team Activity Report did not load - URL check failed");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Project Team Activity load took: ${seconds}s`);

	await logCurrentState(driver, "Open Project Team Activity");
	await pauseForObservation(driver, "Project Team Activity content");

	// --- LOGOUT ---
	await performLogout(driver, 'curator');

	return seconds;
}
