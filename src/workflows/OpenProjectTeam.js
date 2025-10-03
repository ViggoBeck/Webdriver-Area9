// OpenProjectTeam.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

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
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	await waitFor.smartClick(driver, signInBtn);

	// Wait for curator login to complete
	await waitFor.loginComplete(driver, 'curator', 20000);
	console.log("✅ Login completed, dashboard loaded");

	// --- OPEN MENU / ANALYTICS ---
	console.log("🍔 Opening menu for Analytics access...");

	// First, try to open the menu if needed
	try {
		const menuBtn = await waitFor.element(driver, selectorsFor.area9.showMenuButton(), {
			timeout: 5000,
			visible: true,
			clickable: true,
			errorPrefix: 'Show Menu button'
		});
		await waitFor.smartClick(driver, menuBtn);
		console.log("✅ Menu opened");
	} catch (error) {
		console.log("ℹ️ Menu might already be open or not needed");
	}

	// Now locate Analytics button
	const analyticsBtn = await waitFor.element(driver, By.xpath("//button[@aria-label='Analytics']"), {
		timeout: 15000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Analytics button'
	});

	console.log("🔍 Clicking Analytics button...");
	await waitFor.smartClick(driver, analyticsBtn);

	// Wait for navigation to Analytics
	await waitFor.navigationReady(driver, 10000);

	// --- LOCATE PROJECT TEAM ACTIVITY CARD ---
	console.log("🔍 Looking for Project Team Activity card...");

	// Multiple selectors to find the correct PROJECT TEAM ACTIVITY card (not UNIQUE USERS)
	const projectTeamCardSelectors = [
		By.xpath("//p[normalize-space()='PROJECT TEAM ACTIVITY' and contains(@style,'font-size: 30px')]/ancestor::div[contains(@style,'cursor: pointer')]"),
		By.xpath("//div[contains(@style,'cursor: pointer') and .//p[normalize-space()='PROJECT TEAM ACTIVITY' and contains(@style,'font-size: 30px')]]"),
		By.xpath("//div[@class='nativeWidget' and contains(@style,'cursor: pointer') and .//p[text()='PROJECT TEAM ACTIVITY']]"),
		By.xpath("//div[contains(@style,'cursor: pointer') and .//p[normalize-space()='PROJECT TEAM ACTIVITY'] and not(.//p[contains(text(),'UNIQUE USERS')])]")
	];

	const projectTeamCard = await waitFor.elementWithFallbacks(driver, projectTeamCardSelectors, {
		timeout: 15000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Project Team Activity card'
	});

	console.log("🔍 Clicking Project Team Activity card...");
	await waitFor.smartClick(driver, projectTeamCard);

	// --- WAIT FOR PROJECT TEAM SELECTION TO APPEAR ---
	console.log("⏳ Waiting for project team selection to appear...");

	// Wait for network activity and page change
	await waitFor.networkIdle(driver, 1500, 10000);

	// Look for project team selection element with multiple strategies
	const projectTeamSelectors = [
		By.xpath("//*[contains(text(), 'Benchmark Test BR') or contains(text(), 'Benchmark')]"),
		By.xpath("//button[not(contains(@aria-label, 'Show Menu')) and not(contains(@aria-label, 'Analytics'))]"),
		By.xpath("//div[contains(@style, 'cursor: pointer') and contains(@class, 'nativeWidget')]")
	];

	let projectTeamElement = null;

	for (const selector of projectTeamSelectors) {
		try {
			projectTeamElement = await waitFor.element(driver, selector, {
				timeout: 5000,
				visible: true,
				clickable: true,
				errorPrefix: 'Project team selection'
			});
			console.log("✅ Found project team selection element");
			break;
		} catch (error) {
			// Try next selector
		}
	}

	// Fallback: find any clickable elements with relevant text
	if (!projectTeamElement) {
		console.log("⚠️ Trying fallback: searching for clickable elements with relevant text...");
		const clickableElements = await driver.findElements(
			By.xpath("//button | //div[contains(@style, 'cursor: pointer')]")
		);

		for (let element of clickableElements) {
			try {
				const text = await element.getText();
				if (text && (text.includes('Benchmark') || text.includes('Test') || text.includes('BR') || text.includes('Project'))) {
					projectTeamElement = element;
					console.log(`✅ Using fallback element: "${text}"`);
					break;
				}
			} catch (e) {
				// Skip this element
			}
		}
	}

	// --- START TIMER + CHOOSE PROJECT TEAM ---
	console.log("🚀 Starting timer - choosing project team...");
	const start = Date.now();

	if (projectTeamElement) {
		await waitFor.smartClick(driver, projectTeamElement);
		console.log("✅ Selected project team");
	} else {
		console.log("⚠️ No specific project team element found, timing from card click");
	}

	// --- WAIT FOR REPORT TO LOAD ---
	console.log("⏳ Waiting for Project Team Activity report to load...");

	// Wait for network activity to settle
	await waitFor.networkIdle(driver, 1500, 10000);

	// Verify report content loaded
	let loaded = false;

	// Try multiple detection strategies
	const reportIndicators = [
		By.xpath("//*[contains(text(),'Project Team') or contains(text(),'Activity') or contains(text(),'Report') or contains(text(),'Statistics')]"),
		By.css('table, [role="table"], .report, [class*="report"]'),
		By.xpath("//h1 | //h2 | //h3")
	];

	for (const indicator of reportIndicators) {
		try {
			await waitFor.element(driver, indicator, {
				timeout: 5000,
				visible: true,
				errorPrefix: 'Report content indicator'
			});
			console.log("✅ Report content detected");
			loaded = true;
			break;
		} catch (error) {
			// Try next indicator
		}
	}

	// Fallback: check URL
	if (!loaded) {
		const url = await driver.getCurrentUrl();
		if (url.includes("project") || url.includes("team") || url.includes("report")) {
			console.log("✅ Report detected via URL");
			loaded = true;
		}
	}

	if (!loaded) {
		throw new Error("❌ Project Team Activity Report did not load in time");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Project Team Activity load took: ${seconds}s`);

	await logCurrentState(driver, "Open Project Team Activity");
	await pauseForObservation(driver, "Project Team Activity content", 2);

	return seconds;
}
