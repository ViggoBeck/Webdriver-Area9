// src/workflowsCache/compareCourseCatalog.js
// Cache comparison workflow - matches the working openCourseCatalog.js approach

import { By } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { logResult } from "../utils/log.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { logger } from "../utils/logger.js";

/** Single Course Catalog access from menu (assumes already on dashboard) */
async function openCourseCatalogFromMenu(driver) {
	logger.info("🎯 Measuring Course Catalog menu access...");

	// --- CRITICAL: Wait for page to stabilize after overlay dismissal ---
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.debug("✅ Page stabilized");

	// --- OPEN MENU WITH SIMPLE RETRY LOGIC (matching working workflow) ---
	logger.debug("🍔 Opening menu for Course Catalog access...");

	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding menu button...`);

			// Find element fresh each time - only check visible and stable (NOT clickable)
			const menuBtn = await waitFor.element(driver, selectorsFor.area9.showMenuButton(), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // KEY: Don't check clickability like the working workflow
				errorPrefix: `Show Menu button (attempt ${attempt})`
			});

			// Scroll to center
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", menuBtn);

			// Simple click with JS fallback (no CSS manipulation)
			try {
				await menuBtn.click();
				logger.debug(`✅ Regular click succeeded`);
			} catch (clickError) {
				logger.debug(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", menuBtn);
				logger.debug(`✅ JS click succeeded`);
			}

			logger.info("✅ Menu opened successfully");
			break; // Success, exit retry loop

		} catch (error) {
			if (error.message.includes('stale element')) {
				logger.debug(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click menu button after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	// Wait for menu to fully open
	await waitFor.networkIdle(driver, 500, 3000);

	// --- START TIMER + CLICK COURSE CATALOG ---
	logger.debug("📚 Looking for Course Catalog button...");

	let catalogClicked = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			logger.debug(`🔍 Attempt ${attempt}: Finding Course Catalog button...`);

			const catalogBtn = await waitFor.element(driver, By.xpath("//button[@aria-label='COURSE CATALOG']"), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false, // KEY: Don't check clickability
				errorPrefix: `Course Catalog button (attempt ${attempt})`
			});

			// Scroll to center
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", catalogBtn);

			logger.debug(`🔍 Attempt ${attempt}: Clicking Course Catalog button...`);

			// --- START TIMER RIGHT BEFORE CLICK ---
			const start = Date.now();

			// Simple click with JS fallback
			try {
				await catalogBtn.click();
				logger.debug(`✅ Regular click succeeded`);
			} catch (clickError) {
				logger.debug(`⚠️ Regular click failed, using JS click`);
				await driver.executeScript("arguments[0].click();", catalogBtn);
				logger.debug(`✅ JS click succeeded`);
			}

			catalogClicked = true;

			// --- WAIT FOR CATALOG CONTENT TO LOAD ---
			logger.debug("📚 Waiting for Course Catalog content to load...");

			// Wait for network activity to settle
			await waitFor.networkIdle(driver, 1500, 10000);

			// Verify catalog content loaded
			let loaded = false;

			// Strategy 1: Look for nativeWidget divs with images
			try {
				await waitFor.element(driver, By.css('div.nativeWidget img'), {
					timeout: 5000,
					visible: true,
					errorPrefix: 'Catalog content (nativeWidget with image)'
				});
				logger.debug("✅ Catalog content detected (nativeWidget structure)");
				loaded = true;
			} catch (error) {
				// Try next strategy
			}

			// Strategy 2: Check URL contains "courses"
			if (!loaded) {
				const url = await driver.getCurrentUrl();
				logger.debug(`🔍 Current URL: ${url}`);
				if (url.includes("courses") || url.includes("#courses")) {
					logger.debug("✅ Catalog detected via URL (#courses)");
					loaded = true;
				}
			}

			// Strategy 3: Look for any images (fallback)
			if (!loaded) {
				try {
					const images = await driver.findElements(By.css('img'));
					if (images.length > 0) {
						logger.debug(`✅ Catalog detected via images (${images.length} found)`);
						loaded = true;
					}
				} catch (error) {
					// Continue to error
				}
			}

			if (!loaded) {
				throw new Error("❌ Course Catalog did not load in time - no content detected");
			}

			// --- STOP TIMER ---
			const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
			logger.info(`⏱ Course Catalog load took: ${seconds}s`);

			await logCurrentState(driver, "Course Catalog Access");
			await pauseForObservation(driver, "Course Catalog content loaded", 1);

			return seconds;

		} catch (error) {
			if (error.message.includes('stale element')) {
				logger.debug(`⚠️ Attempt ${attempt}: Stale element, retrying with fresh lookup...`);
				await waitFor.networkIdle(driver, 500, 3000);
				continue;
			}

			if (attempt === 3) {
				throw new Error(`❌ Failed to click Course Catalog after ${attempt} attempts: ${error.message}`);
			}

			logger.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
			await waitFor.networkIdle(driver, 1000, 3000);
		}
	}

	if (!catalogClicked) {
		throw new Error("❌ Could not click Course Catalog button after all retry attempts");
	}
}

export async function compareCourseCatalog(driver) {
	logger.info("🔬 Course Catalog Cache Comparison - Cold vs Warm using menu navigation");

	// === ONE-TIME SETUP - LOGIN ===
	logger.info("🌐 Navigating to learner URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Login
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 20000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Course Catalog Cache"));

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

	// Wait for login to complete
	await waitFor.loginComplete(driver, 'learner', 30000);
	logger.info("✅ Dashboard loaded successfully");

	// --- INITIAL OVERLAY DISMISSAL (from working workflow) ---
	await dismissOverlays(driver);

	// --- CRITICAL: Wait for page to stabilize after overlay dismissal (KEY FIX) ---
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.debug("✅ Page stabilized after overlay dismissal");

	// === COLD/WARM COMPARISON ===

	// COLD: First Course Catalog access
	logger.info("\n❄️  Course Catalog — COLD (first access)");
	const cold = await openCourseCatalogFromMenu(driver);
	logResult("Open Course Catalog (cold)", cold);

	// Return to Dashboard
	logger.info("🔄 Returning to Dashboard via menu...");

	// Open menu with simple retry (matching working workflow)
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const menuBtn = await waitFor.element(driver, selectorsFor.area9.showMenuButton(), {
				timeout: 15000,
				visible: true,
				stable: true,
				clickable: false,
				errorPrefix: 'Menu button'
			});
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", menuBtn);

			try {
				await menuBtn.click();
			} catch {
				await driver.executeScript("arguments[0].click();", menuBtn);
			}

			logger.info("✅ Menu opened for Dashboard navigation");
			break;
		} catch (e) {
			if (attempt === 3) {
				logger.warn("⚠️ Menu button failed, using fallback navigation...");
				await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
				await waitFor.loginComplete(driver, 'learner', 20000);
				await dismissOverlays(driver);
				await waitFor.networkIdle(driver, 1000, 5000);
				break;
			}
			await waitFor.networkIdle(driver, 500, 3000);
		}
	}

	// If menu opened, click Dashboard button
	try {
		const dashboardBtn = await waitFor.element(driver, By.css('button[aria-label="Dashboard"]'), {
			timeout: 5000,
			visible: true,
			stable: true,
			clickable: false,
			errorPrefix: 'Dashboard button'
		});
		await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", dashboardBtn);
		try {
			await dashboardBtn.click();
		} catch {
			await driver.executeScript("arguments[0].click();", dashboardBtn);
		}
		logger.info("✅ Dashboard button clicked");
	} catch (e) {
		logger.debug("⚠️ Dashboard button not found (likely already on dashboard)");
	}

	// Wait for dashboard to load
	await waitFor.loginComplete(driver, 'learner', 20000);
	logger.info("✅ Dashboard loaded for warm test");

	// Wait for page to stabilize
	await dismissOverlays(driver);
	await waitFor.networkIdle(driver, 1000, 5000);
	logger.debug("✅ Page stabilized after overlay dismissal");

	// WARM: Second Course Catalog access (benefits from cache)
	logger.info("\n🔥 Course Catalog — WARM (second access, cached)");
	const warm = await openCourseCatalogFromMenu(driver);
	logResult("Open Course Catalog (warm)", warm);

	// === CLEANUP ===
	await performLogout(driver, 'learner');

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	logger.always(`\n📊 Course Catalog Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result
	return warm;
}
