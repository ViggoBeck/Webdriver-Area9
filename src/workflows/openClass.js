import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function openClass(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildEducatorUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	await emailField.sendKeys(getAccountForTest("Open Class"));

	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await driver.findElement(By.id("sign_in"));
	await signInBtn.click();
	await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

	// --- DASHBOARD ---
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(),'Educator') or contains(text(),'Dashboard') or contains(text(),'Classes')]")),
		DEFAULT_TIMEOUT
	);

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotItCandidates = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
		for (let btn of gotItCandidates) {
			if (await btn.isDisplayed()) {
				await driver.executeScript("arguments[0].click();", btn);
				await driver.wait(until.stalenessOf(btn), 10000);
				break;
			}
		}
	} catch {}

	// --- LOCATE "Benchmark Test 1 Do not touch" CLASS ---
	console.log("🔍 Looking for 'Benchmark Test 1 Do not touch' class...");

	const classSelectors = [
		// Target the table row containing the specific class name
		By.xpath("//tr[@role='row' and .//p[normalize-space()='Benchmark Test 1 Do not touch']]"),

		// Alternative: target the paragraph and go to ancestor tr
		By.xpath("//p[normalize-space()='Benchmark Test 1 Do not touch']/ancestor::tr"),

		// Alternative: target by cursor pointer style and text content
		By.xpath("//tr[contains(@style,'cursor: pointer') and .//p[normalize-space()='Benchmark Test 1 Do not touch']]"),

		// Fallback: any clickable element containing the class name
		By.xpath("//*[contains(text(),'Benchmark Test 1 Do not touch') and (contains(@style,'cursor: pointer') or @role='row')]")
	];

	let classElement = null;

	for (let i = 0; i < classSelectors.length; i++) {
		try {
			console.log(`🔍 Trying class selector ${i + 1}`);
			classElement = await driver.wait(until.elementLocated(classSelectors[i]), 8000);

			const isVisible = await classElement.isDisplayed();
			if (isVisible) {
				console.log(`✅ Found 'Benchmark Test 1 Do not touch' class using selector ${i + 1}`);
				break;
			} else {
				console.log(`⚠️ Class found but not visible with selector ${i + 1}`);
				classElement = null;
			}
		} catch (e) {
			console.log(`❌ Class selector ${i + 1} failed: ${e.message}`);
		}
	}

	if (!classElement) {
		throw new Error("❌ Could not find 'Benchmark Test 1 Do not touch' class");
	}

	// Scroll the class into view
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", classElement);
	await new Promise(r => setTimeout(r, 500));

	// --- START TIMER + CLICK CLASS ---
	console.log("🚀 Starting timer - clicking class...");
	const start = Date.now();

	try {
		await classElement.click();
		console.log("✅ Clicked 'Benchmark Test 1 Do not touch' class");
	} catch {
		await driver.executeScript("arguments[0].click();", classElement);
		console.log("✅ JS click on 'Benchmark Test 1 Do not touch' class");
	}

	// --- WAIT FOR CLASS TO OPEN WITH LEARNER PERFORMANCE DATA ---
	console.log("⏳ Waiting for class to fully load with learners' performance...");

	const classOpenSelectors = [
		// Look for learners' performance content (primary indicator)
		By.xpath("//*[contains(text(),'learners') and contains(text(),'performance')]"),
		By.xpath("//*[contains(text(),'learner') and contains(text(),'performance')]"),

		// Look for student performance related content
		By.xpath("//*[contains(text(),'Students') and (contains(text(),'performance') or contains(text(),'Progress'))]"),

		// Look for performance metrics or analytics
		By.xpath("//*[contains(text(),'Performance') or contains(text(),'Analytics') or contains(text(),'Progress')]"),

		// Look for baseline widgets (indicating content is rendered)
		By.css("span.baselineWidget[role='presentation']"),
		By.xpath("//span[@class='baselineWidget' and @role='presentation']"),

		// Fallback: look for any class content with student data
		By.xpath("//*[contains(text(),'Student') or contains(text(),'Learner') or contains(text(),'Progress')]"),

		// Generic class dashboard indicators
		By.xpath("//*[contains(text(),'Benchmark Test 1') and (contains(text(),'Class') or contains(text(),'Dashboard'))]")
	];

	let classOpened = false;

	for (let i = 0; i < classOpenSelectors.length; i++) {
		try {
			await driver.wait(until.elementLocated(classOpenSelectors[i]), 5000);
			console.log(`✅ Class opened - detected using selector ${i + 1}`);
			classOpened = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	// Fallback: check URL change
	if (!classOpened) {
		const currentUrl = await driver.getCurrentUrl();
		if (currentUrl.includes("class") || currentUrl.includes("course") || currentUrl !== buildEducatorUrl()) {
			console.log("✅ URL changed - class likely opened");
			classOpened = true;
		}
	}

	// Additional fallback: wait a bit more and check if we're no longer on main dashboard
	if (!classOpened) {
		console.log("⏳ Additional wait for class to load...");
		await new Promise(r => setTimeout(r, 3000));

		// Check if dashboard elements are gone (indicating we navigated away)
		const dashboardElements = await driver.findElements(By.xpath("//*[contains(text(),'Classes') or contains(text(),'Dashboard')]"));
		if (dashboardElements.length === 0 || !(await dashboardElements[0].isDisplayed())) {
			console.log("✅ Navigated away from dashboard - class opened");
			classOpened = true;
		}
	}

	if (!classOpened) {
		console.log("⚠️ Could not definitively confirm class opened, but timing recorded");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Class open took: ${seconds}s`);

	await logCurrentState(driver, "Open Class");
	await pauseForObservation(driver, "Class opened - viewing class content", 3);

	return seconds;
}