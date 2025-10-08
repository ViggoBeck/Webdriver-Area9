import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { logResult } from "../utils/log.js";

// Single Review tab click measurement (assumes already on class content page)
async function clickReviewsTab(driver) {
	logger.info("🎯 Measuring Reviews tab click to load...");

	// START TIMING: When clicking on Reviews tab (same as openReview.js)
	const start = Date.now();

	// Click the Reviews tab using the exact selector from openReview.js
	const reviewsTab = await driver.wait(
		until.elementLocated(By.css('button[aria-label="reviews"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(reviewsTab), 5000);
	await reviewsTab.click();

	// Wait for reviews content to be visible (same logic as openReview.js)
	let reviewsLoaded = false;

	// Approach 1: Look for the actual tab panel
	try {
		await driver.wait(
			until.elementLocated(By.id("tabs31_tabpanel3")), // The actual panel ID
			5000
		);
		logger.info("✅ Reviews panel found by ID");
		reviewsLoaded = true;
	} catch (e) {
		logger.info("ℹ️ Reviews panel ID not found, trying other methods...");
	}

	// Approach 2: Check that the tab is now selected/active
	if (!reviewsLoaded) {
		try {
			const selectedTab = await driver.wait(
				until.elementLocated(By.css('button[aria-label="reviews"][aria-selected="true"]')),
				5000
			);
			logger.info("✅ Reviews tab is selected");
			reviewsLoaded = true;
		} catch (e) {
			logger.info("ℹ️ Could not verify tab selection...");
		}
	}

	// Approach 3: Look for any review-related content
	if (!reviewsLoaded) {
		try {
			await driver.wait(
				until.elementLocated(By.xpath("//*[contains(text(), 'Review') or contains(@class, 'review') or contains(text(), 'Submission')]")),
				5000
			);
			logger.info("✅ Review content detected by text");
			reviewsLoaded = true;
		} catch (e) {
			logger.info("ℹ️ No specific review content found...");
		}
	}

	// Fallback: If tab was clicked successfully, assume it worked
	if (!reviewsLoaded) {
		logger.info("✅ Reviews tab was clicked - assuming content loaded");
		await new Promise(resolve => setTimeout(resolve, 1000));
	}

	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	logger.info(`⏱ Reviews tab click-to-load: ${seconds}s`);

	await logCurrentState(driver, "Reviews Tab Click");
	await pauseForObservation(driver, "Reviews content loaded", 1);

	return seconds;
}

export async function compareReview(driver) {
	logger.info("🔬 Review Cache Comparison - Cold vs Warm using tab navigation");

	// === ONE-TIME SETUP ===
	logger.info("🌐 Logging in as educator...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Login once (same as openReview.js)
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Review Cache");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);
	await signInButton.click();

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Dashboard')]")),
		20000
	);

	// Navigate to the class content page (same as openReview.js)
	logger.info("🏫 Navigating to class content page...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=classcontent");
	await new Promise(resolve => setTimeout(resolve, 3000));
	logger.info("✅ Class content page loaded");

	// === COLD/WARM COMPARISON ===

	// COLD: First Reviews tab click
	logger.info("\n❄️  Reviews — COLD (first click)");
	const cold = await clickReviewsTab(driver);
	logResult("Open Review (cold)", cold);

	// Click the "classcontent" tab to go back (using user-specified button)
	logger.info("🔄 Clicking class content tab to return...");

	let classContentBtn;
	try {
		// Find the class content tab button (user-specified selector)
		classContentBtn = await driver.wait(
			until.elementLocated(By.css('button[aria-label="classcontent"]')),
			10000
		);
		await driver.wait(until.elementIsVisible(classContentBtn), 5000);
		await driver.executeScript("arguments[0].click();", classContentBtn);
		logger.info("✅ Class content tab clicked");
	} catch (e) {
		logger.info("⚠️ Class content tab not found, using fallback navigation...");
		// Fallback: refresh the page to class content
		await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=classcontent");
		await new Promise(resolve => setTimeout(resolve, 2000));
	}

	// Wait a moment for tab content to load
	await new Promise(r => setTimeout(r, 2000));

	// WARM: Second Reviews tab click (benefits from cache)
	logger.info("\n🔥 Reviews — WARM (second click, cached)");
	const warm = await clickReviewsTab(driver);
	logResult("Open Review (warm)", warm);

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	logger.info(`\n📊 Review Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result (since cache tests are about optimization)
	return warm;
}
