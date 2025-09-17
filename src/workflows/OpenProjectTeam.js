import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function openProjectTeamActivity(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildCuratorUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	await emailField.sendKeys(getAccountForTest("Open Project Team Activity"));

	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await driver.findElement(By.id("sign_in"));
	await signInBtn.click();
	await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

	// --- DASHBOARD ---
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(),'Curator') or contains(text(),'Dashboard')]")),
		DEFAULT_TIMEOUT
	);

	// --- OPEN MENU / ANALYTICS ---
	let analyticsBtn;
	try {
		const menuBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
			DEFAULT_TIMEOUT
		);
		await driver.executeScript("arguments[0].click();", menuBtn);

		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			DEFAULT_TIMEOUT
		);
	} catch {
		analyticsBtn = await driver.wait(
			until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
			DEFAULT_TIMEOUT
		);
	}

	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", analyticsBtn);
	await driver.executeScript("arguments[0].click();", analyticsBtn);

	// --- LOCATE PROJECT TEAM ACTIVITY CARD ---
	// Multiple selectors to find the correct PROJECT TEAM ACTIVITY card (not UNIQUE USERS)
	const projectTeamCardSelectors = [
		// Target the clickable div that contains the PROJECT TEAM ACTIVITY with large font (30px)
		By.xpath("//p[normalize-space()='PROJECT TEAM ACTIVITY' and contains(@style,'font-size: 30px')]/ancestor::div[contains(@style,'cursor: pointer')]"),

		// Alternative: look for the image container with PROJECT TEAM ACTIVITY
		By.xpath("//div[contains(@style,'cursor: pointer') and .//p[normalize-space()='PROJECT TEAM ACTIVITY' and contains(@style,'font-size: 30px')]]"),

		// Alternative: target by the specific div structure
		By.xpath("//div[@class='nativeWidget' and contains(@style,'cursor: pointer') and .//p[text()='PROJECT TEAM ACTIVITY']]"),

		// Fallback: any clickable div containing PROJECT TEAM ACTIVITY (but not UNIQUE USERS)
		By.xpath("//div[contains(@style,'cursor: pointer') and .//p[normalize-space()='PROJECT TEAM ACTIVITY'] and not(.//p[contains(text(),'UNIQUE USERS')])]")
	];

	let projectTeamCard = null;

	for (let i = 0; i < projectTeamCardSelectors.length; i++) {
		try {
			console.log(`🔍 Trying PROJECT TEAM ACTIVITY selector ${i + 1}`);
			projectTeamCard = await driver.wait(until.elementLocated(projectTeamCardSelectors[i]), 8000);
			await driver.wait(until.elementIsVisible(projectTeamCard), 3000);
			console.log(`✅ Found PROJECT TEAM ACTIVITY card using selector ${i + 1}`);
			break;
		} catch (e) {
			console.log(`❌ PROJECT TEAM ACTIVITY selector ${i + 1} failed: ${e.message}`);
		}
	}

	if (!projectTeamCard) {
		throw new Error("❌ Could not find PROJECT TEAM ACTIVITY card");
	}

	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", projectTeamCard);
	await new Promise(r => setTimeout(r, 300));

	// --- CLICK PROJECT TEAM ACTIVITY CARD (not timed) ---
	try {
		await projectTeamCard.click();
		console.log("✅ Clicked Project Team Activity card");
	} catch {
		await driver.executeScript("arguments[0].click();", projectTeamCard);
		console.log("✅ JS click on Project Team Activity card");
	}

	// --- WAIT FOR PROJECT TEAM SELECTION TO APPEAR ---
	console.log("⏳ Waiting for project team selection to appear...");

	// Wait a moment for the selection UI to load after clicking the card
	await new Promise(r => setTimeout(r, 2000));

	// Use the selector we know works from testing
	let projectTeamElement = null;

	try {
		console.log("🔍 Looking for project team selection...");

		// Use the working selector directly (was selector 5 in testing)
		projectTeamElement = await driver.wait(
			until.elementLocated(By.xpath("//button[not(contains(@aria-label, 'Show Menu')) and not(contains(@aria-label, 'Analytics'))] | //div[contains(@style, 'cursor: pointer') and contains(@class, 'nativeWidget')]")),
			8000
		);

		// Check if visible
		const isVisible = await projectTeamElement.isDisplayed();
		if (isVisible) {
			console.log("✅ Found project team selection element");
		} else {
			throw new Error("Element not visible");
		}

	} catch (e) {
		console.log(`❌ Primary selector failed: ${e.message}`);

		// Quick fallback attempt with specific text
		try {
			console.log("⚠️ Trying fallback selector...");
			projectTeamElement = await driver.wait(
				until.elementLocated(By.xpath("//*[contains(text(), 'Benchmark Test BR') or contains(text(), 'Benchmark')]")),
				3000
			);
			console.log("✅ Found project team using fallback");
		} catch (fallbackError) {
			console.log(`❌ Fallback also failed: ${fallbackError.message}`);
		}
	}

	// If no specific selectors worked, try a very broad approach
	if (!projectTeamElement) {
		console.log("⚠️ Trying fallback: look for any new clickable elements...");
		try {
			// Find any clickable elements that might be project team options
			const clickableElements = await driver.findElements(By.xpath("//button | //div[contains(@style, 'cursor: pointer')]"));

			for (let element of clickableElements) {
				try {
					const text = await element.getText();
					console.log(`🔍 Found clickable element with text: "${text}"`);

					// If it contains relevant keywords, use it
					if (text && (text.includes('Benchmark') || text.includes('Test') || text.includes('BR') || text.includes('Project'))) {
						projectTeamElement = element;
						console.log(`✅ Using fallback element: "${text}"`);
						break;
					}
				} catch (e) {
					// Skip this element
				}
			}
		} catch (e) {
			console.log(`❌ Fallback also failed: ${e.message}`);
		}
	}

	if (!projectTeamElement) {
		// Final fallback: just wait a bit and continue with timing
		console.log("⚠️ No project team selection found, proceeding with timing anyway...");
		await new Promise(r => setTimeout(r, 1000));
	}

	// --- START TIMER + CHOOSE PROJECT TEAM ---
	console.log("🚀 Starting timer - choosing project team...");
	const start = Date.now();

	if (projectTeamElement) {
		await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", projectTeamElement);
		await new Promise(r => setTimeout(r, 500));

		try {
			await projectTeamElement.click();
			console.log("✅ Selected project team");
		} catch {
			await driver.executeScript("arguments[0].click();", projectTeamElement);
			console.log("✅ JS click on project team selection");
		}
	} else {
		console.log("⚠️ No specific project team element found, timing from PROJECT TEAM ACTIVITY click");
	}

	// --- WAIT FOR REPORT TO LOAD ---
	console.log("⏳ Waiting for Project Team Activity report to load...");
	let loaded = false;
	try {
		await driver.wait(
			until.elementLocated(By.xpath("//*[contains(text(),'Project Team') or contains(text(),'Activity') or contains(text(),'Report') or contains(text(),'Statistics')]")),
			DEFAULT_TIMEOUT
		);
		loaded = true;
		console.log("✅ Report content detected");
	} catch {}

	if (!loaded) {
		const url = await driver.getCurrentUrl();
		if (url.includes("project") || url.includes("team") || url.includes("report")) {
			loaded = true;
			console.log("✅ URL change detected - report likely loaded");
		}
	}

	if (!loaded) throw new Error("❌ Project Team Activity Report did not load in time");

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Project Team Activity load took: ${seconds}s`);

	await logCurrentState(driver, "Open Project Team Activity");
	await pauseForObservation(driver, "Project Team Activity content", 2);

	return seconds;
}