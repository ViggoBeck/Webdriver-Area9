// OpenProjectTeam.js - Simplified pattern matching proven openUniqueUsersReport
// Uses simple waits and JS clicks to avoid timing issues

import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/logout.js";

export async function openProjectTeamActivity(driver) {
	// --- LOGIN (not timed) ---
	console.log("🌐 Navigating to curator URL for Project Team Activity...");
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
	console.log("✅ Login completed, dashboard loaded");

	// --- OPEN MENU / ANALYTICS ---
	console.log("📂 Opening menu for Analytics access...");

	// Try to find Analytics button (might already be visible if menu is open)
	let analyticsBtn;
	try {
		// First try to find menu button and click it
		const menuBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
			5000
		);
		await driver.executeScript("arguments[0].click();", menuBtn);
		console.log("✅ Menu opened");

		// Wait for menu animation to complete
		await new Promise(resolve => setTimeout(resolve, 300));

		// Now find Analytics button
		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			5000
		);
	} catch (error) {
		// Menu might already be open, try to find Analytics directly
		console.log("⚠️ Menu button not found, checking if Analytics is already visible...");
		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			5000
		);
	}

	// Scroll and click Analytics button (always use JS click to avoid interception)
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", analyticsBtn);
	await driver.executeScript("arguments[0].click();", analyticsBtn);
	console.log("✅ Analytics section opened");

	// --- LOCATE AND CLICK PROJECT TEAM ACTIVITY CARD ---
	console.log("🔍 Looking for Project Team Activity card...");

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
	console.log("⏱️ Starting timer and clicking Project Team Activity card...");

	try {
		await projectTeamCard.click();
		console.log("✅ Regular click succeeded");
	} catch (clickError) {
		console.log("⚠️ Regular click failed, using JS click");
		await driver.executeScript("arguments[0].click();", projectTeamCard);
		console.log("✅ JS click succeeded");
	}

	// --- WAIT FOR REPORT TO LOAD ---
	console.log("⏳ Waiting for Project Team Activity report to load...");

	// Wait for network idle (report data loading)
	await waitFor.networkIdle(driver, 1000, 10000);

	// Verify report loaded via URL
	const url = await driver.getCurrentUrl();
	console.log(`📍 Current URL: ${url}`);

	if (url.includes('reports') || url.includes('dashboard') || url.includes('project')) {
		console.log("✅ Report detected via URL");
	} else {
		throw new Error("❌ Project Team Activity Report did not load - URL check failed");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Project Team Activity load took: ${seconds}s`);

	await logCurrentState(driver, "Open Project Team Activity");
	await pauseForObservation(driver, "Project Team Activity content");

	// --- LOGOUT ---
	await performLogout(driver, 'curator');

	return seconds;
}
