import { By, until } from "selenium-webdriver";

// Shared overlay dismissal for all learner workflows
export async function dismissLearnerOverlay(driver, context = "") {
	let overlaysFound = 0;

	try {
		// --- ONBOARDING OVERLAY ---
		const gotItCandidates = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
		for (let btn of gotItCandidates) {
			if (await btn.isDisplayed()) {
				if (overlaysFound === 0) console.log(`🧹 Dismissing overlays${context ? ' ' + context : ''}...`);
				await driver.executeScript("arguments[0].click();", btn);
				await driver.wait(until.stalenessOf(btn), 10000);
				overlaysFound++;
				break;
			}
		}

		// Additional overlay patterns to handle
		const additionalOverlaySelectors = [
			By.xpath("//*[normalize-space(text())='Got it' or normalize-space(text())='got it']"),
			By.xpath("//*[normalize-space(text())='OK' or normalize-space(text())='Ok']"),
			By.xpath("//*[normalize-space(text())='Close' or normalize-space(text())='CLOSE']"),
			By.xpath("//*[normalize-space(text())='Skip' or normalize-space(text())='SKIP']"),
			By.css("button[aria-label*='close']"),
			By.css("button[aria-label*='dismiss']"),
			By.css(".overlay-close, .modal-close, .popup-close")
		];

		for (const selector of additionalOverlaySelectors) {
			try {
				const overlayButtons = await driver.findElements(selector);
				for (let btn of overlayButtons) {
					if (await btn.isDisplayed()) {
						if (overlaysFound === 0) console.log(`🧹 Dismissing overlays${context ? ' ' + context : ''}...`);
						await driver.executeScript("arguments[0].click();", btn);
						await new Promise(resolve => setTimeout(resolve, 1000));
						overlaysFound++;
						break;
					}
				}
			} catch (e) {
				// Continue checking other selectors
			}
		}

		// Only log if we actually found and dismissed overlays
		if (overlaysFound > 0) {
			console.log(`✅ ${overlaysFound} overlay${overlaysFound > 1 ? 's' : ''} dismissed${context ? ' ' + context : ''}`);
		}

	} catch (error) {
		console.log("⚠️ Error during overlay dismissal:", error.message);
	}

	// Wait a moment for any animations to complete (only if we found overlays)
	if (overlaysFound > 0) {
		await new Promise(resolve => setTimeout(resolve, 1500));
	}
}

// Shared logout functionality for all learner workflows (based on working loginLearner.js implementation)
export async function performLearnerLogout(driver) {
	console.log("🔄 Starting logout...");

	try {
		// Dismiss any overlays first that might interfere with logout
		await dismissLearnerOverlay(driver, "(before logout)");

		// Step 1: Click the menu button with retry logic (like working loginLearner.js)
		let menuBtn = null;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				menuBtn = await driver.wait(
					until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
					5000
				);
				await driver.wait(until.elementIsVisible(menuBtn), 2000);
				await driver.executeScript("arguments[0].click();", menuBtn);
				console.log("✅ Menu opened");
				break;
			} catch (e) {
				console.log(`⚠️ Menu open failed (attempt ${attempt}): ${e.message}`);
				await new Promise(r => setTimeout(r, 1000));
			}
		}
		if (!menuBtn) throw new Error("❌ Could not open menu for logout");

		// Brief pause for menu to fully appear
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Step 2: Click logout button with retry logic
		let logoutBtn = null;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				logoutBtn = await driver.wait(
					until.elementLocated(By.xpath("//button[@aria-label='LOGOUT']")),
					5000
				);
				await driver.wait(until.elementIsVisible(logoutBtn), 2000);
				await driver.executeScript("arguments[0].click();", logoutBtn);
				console.log("✅ Logout clicked");
				break;
			} catch (e) {
				console.log(`⚠️ Logout click failed (attempt ${attempt}): ${e.message}`);
				await new Promise(r => setTimeout(r, 1000));
			}
		}
		if (!logoutBtn) throw new Error("❌ Could not click logout button");

		// Verify logout success
		try {
			await driver.wait(until.elementLocated(By.css('input[name="username"]')), 8000);
			console.log("✅ Logout successful (login form visible)");
		} catch {
			const url = await driver.getCurrentUrl();
			if (url.includes("login") || url.includes("signin")) {
				console.log("✅ Logout successful (redirected to login page)");
			} else {
				console.log("⚠️ Logout may have completed but not verified");
			}
		}

		// Short pause to ensure logout is fully processed
		await new Promise(resolve => setTimeout(resolve, 2000));

	} catch (error) {
		console.log(`⚠️ Logout failed: ${error.message}`);
		console.log("⚠️ This is not critical - continuing with test completion");

		// Log current page state for debugging
		try {
			const currentUrl = await driver.getCurrentUrl();
			const pageTitle = await driver.getTitle();
			console.log(`⚠️ Current URL: ${currentUrl}`);
			console.log(`⚠️ Page title: ${pageTitle}`);
		} catch (debugErr) {
			console.log("⚠️ Could not get current page info for debugging");
		}
	}
}