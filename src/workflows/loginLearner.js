// loginLearner.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { buildLearnerUrl } from "../utils/config.js";

export async function loginLearner(driver) {
	const totalStart = Date.now();

	await driver.get(buildLearnerUrl());

	// --- LOGIN FORM - using smart waits ---
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Login Learner"));

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// --- START TIMER: Right when sign in button is clicked ---
	const start = Date.now();
	await waitFor.smartClick(driver, signInBtn);

	// Wait for login to complete (dashboard appears)
	await waitFor.loginComplete(driver, 'learner');

	// Wait for navigation to be fully interactive - part of measurement
	logger.info("⏳ Waiting for dashboard to be fully interactive...");
	await waitFor.networkIdle(driver, 1000, 5000);

	// --- STOP TIMER: Dashboard is fully interactive ---
	const end = Date.now();
	const seconds = (end - start) / 1000;
	logger.info(`⏱ Login Learner took: ${seconds.toFixed(3)}s (to interactive)`);

	// Dismiss overlay after timing
	await dismissOverlay(driver);

	// Extra stabilization time for learner dashboard before logout
	await new Promise(resolve => setTimeout(resolve, 2000));
	logger.info("✅ Dashboard ready for logout");

	// Debug snapshot
	await logCurrentState(driver, "Login Learner");
	await pauseForObservation(driver, "Dashboard loaded - learner interface", 2);

	// --- LOGOUT ---
	await performLogout(driver);

	const totalSeconds = ((Date.now() - totalStart) / 1000).toFixed(2);
	logger.info(`✅ Login Learner completed in ${seconds.toFixed(3)}s (measured) | ${totalSeconds}s total incl. cleanup`);

	return seconds;
}

// --- OVERLAY HANDLING - using smart waits ---
async function dismissOverlay(driver) {
	try {
		const gotItButton = await waitFor.element(driver, selectorsFor.area9.gotItButton(), {
			timeout: 5000,
			visible: true,
			clickable: true,
			stable: true,
			errorPrefix: 'Got It overlay button'
		});

		logger.info("✅ Found GOT IT overlay, dismissing...");
		await waitFor.smartClick(driver, gotItButton);

		// Wait for overlay to actually disappear
		await driver.wait(async () => {
			const overlayButtons = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
			if (overlayButtons.length === 0) return true;

			// Check if any are still visible
			for (const btn of overlayButtons) {
				try {
					if (await btn.isDisplayed()) return false;
				} catch (e) {
					// Stale element = gone, which is good
				}
			}
			return true;
		}, 5000);

		logger.info("✅ Overlay dismissed successfully");
	} catch (error) {
		logger.info("ℹ️ No overlay detected (this is normal)");
	}
}

// --- LOGOUT HANDLING - using smart waits ---
async function performLogout(driver) {
	logger.info("🔄 Starting logout...");

	// Wait for menu button to be ready - with reduced stability requirement
	const menuBtn = await waitFor.element(driver, selectorsFor.area9.showMenuButton(), {
		timeout: 15000,
		visible: true,
		clickable: false,  // Don't check clickability - we'll use JS click
		stable: false,      // Don't check stability
		errorPrefix: 'Show Menu button'
	});

	// Ensure menu button is in viewport and force visibility
	await driver.executeScript(`
		const element = arguments[0];
		element.scrollIntoView({behavior: 'instant', block: 'center'});

		// Force z-index to ensure it's on top
		element.style.zIndex = '9999';
		element.style.position = 'relative';
	`, menuBtn);

	// Wait a moment for any animations to settle
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Use JavaScript click to bypass obstruction issues
	await driver.executeScript("arguments[0].click();", menuBtn);
	logger.info("✅ Menu opened (via JS click)");

	// Wait for logout button to appear
	const logoutBtn = await waitFor.element(driver, selectorsFor.area9.logoutButton(), {
		timeout: 10000,
		visible: true,
		clickable: false,
		stable: false,
		errorPrefix: 'Logout button'
	});

	// Use JavaScript click for logout as well
	await driver.executeScript("arguments[0].click();", logoutBtn);
	logger.info("✅ Logout clicked (via JS click)");

	// Verify logout success using smart wait
	try {
		await waitFor.element(driver, selectorsFor.area9.usernameField(), {
			timeout: 8000,
			visible: true,
			errorPrefix: 'Login form after logout'
		});
		logger.info("✅ Logout successful (login form visible)");
	} catch (error) {
		const url = await driver.getCurrentUrl();
		if (url.includes("login") || url.includes("signin")) {
			logger.info("✅ Logout successful (redirected to login page)");
		} else {
			logger.info("⚠️ Logout may have completed but not verified");
		}
	}
}
