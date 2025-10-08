// src/workflowsCache/compareScorm.js
// Cache comparison workflow with smart waits, session management, and retry logic

import { By } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { logResult } from "../utils/log.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { logger } from "../utils/logger.js";

/** Single SCORM card click measurement (assumes already on dashboard) */
async function clickScormCard(driver) {
	logger.info("🎯 Measuring SCORM card click to load...");

	// --- FIND SCORM CARD ---
	const scormCardXPath = `
		//p[normalize-space()='1 Scorm Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Scorm' and not(@disabled)]
	`;

	// --- FIND AND CLICK SCORM CARD WITH AGGRESSIVE STRATEGY ---
	logger.debug("🎯 Looking for SCORM card with aggressive detection...");

	// Wait for dashboard to fully settle first
	await waitFor.networkIdle(driver, 2000, 8000);
	logger.debug("✅ Dashboard settled");

	// Aggressively dismiss any lingering overlays
	await dismissOverlays(driver);

	// Remove any blocking elements
	await driver.executeScript(`
		// Remove common overlay/modal elements
		const selectors = [
			'[class*="overlay"]',
			'[class*="modal"]',
			'[class*="backdrop"]',
			'[class*="dimmer"]',
			'[style*="z-index"]'
		];

		selectors.forEach(selector => {
			document.querySelectorAll(selector).forEach(el => {
				const zIndex = parseInt(window.getComputedStyle(el).zIndex);
				if (zIndex > 1000) {
					el.style.display = 'none';
				}
			});
		});
	`);

	let scormBtn = null;

	// Try to find element
	try {
		scormBtn = await waitFor.element(driver, By.xpath(scormCardXPath), {
			timeout: 8000,
			visible: true,
			stable: true,
			errorPrefix: 'SCORM Benchmark Test card'
		});
		logger.info("✅ Found SCORM Benchmark Test card");
	} catch (e) {
		logger.error("❌ SCORM card not found on dashboard");
		throw new Error("SCORM Benchmark Test card not visible on dashboard");
	}

	// Scroll into view and force visibility/clickability
	await driver.executeScript(`
		const element = arguments[0];
		element.scrollIntoView({block:'center', inline:'center'});

		// Force visibility and clickability on element and ancestors
		let el = element;
		while (el && el !== document.body) {
			if (el.style) {
				el.style.visibility = 'visible';
				el.style.opacity = '1';
				el.style.pointerEvents = 'auto';
				el.style.zIndex = '99999';
			}
			el = el.parentElement;
		}
	`, scormBtn);

	// Longer settle time after scroll
	await new Promise(r => setTimeout(r, 1500));
	logger.debug("✅ Scrolled and settled");

	// --- START TIMER: Before clicking ---
	const start = Date.now();

	// --- CLICK SCORM CARD WITH JAVASCRIPT (MOST RELIABLE) ---
	logger.debug("🖱️ Clicking SCORM card...");

	try {
		// Use JavaScript click directly for most reliability
		await driver.executeScript("arguments[0].click();", scormBtn);
		logger.info(`✅ SCORM card clicked successfully`);
	} catch (e) {
		logger.error(`❌ SCORM card click failed: ${e.message}`);
		throw new Error(`SCORM card click failed: ${e.message}`);
	}

	// --- WAIT FOR SCORM CONTENT TO LOAD ---
	logger.info("⏳ Waiting for SCORM content to load...");

	// Wait for URL change first (navigation to SCORM content)
	try {
		await driver.wait(async () => {
			const url = await driver.getCurrentUrl();
			return url.includes('card=') || url.includes('scorm');
		}, 8000);
		logger.debug("✅ URL changed - SCORM navigation detected");
	} catch (e) {
		logger.debug("⚠️ URL didn't change, checking for iframe...");
	}

	// Wait for network to settle after navigation
	await waitFor.networkIdle(driver, 1500, 8000);

	// Wait for SCORM iframe to be present and loaded
	try {
		const iframes = await driver.findElements(By.css('iframe'));
		if (iframes.length > 0) {
			logger.debug(`✅ Found ${iframes.length} iframe(s)`);

			// Wait for iframe to be actually loaded
			await driver.wait(async () => {
				try {
					const readyState = await driver.executeScript(`
						const iframes = document.querySelectorAll('iframe');
						if (iframes.length === 0) return false;

						// Check if at least one iframe has loaded content
						for (const iframe of iframes) {
							try {
								if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
									return true;
								}
							} catch (e) {
								// Cross-origin iframe - assume loaded
								return true;
							}
						}
						return false;
					`);
					return readyState;
				} catch (e) {
					return true; // Assume loaded if script fails
				}
			}, 5000);
			logger.debug("✅ Iframe detection inconclusive");
		}
	} catch (e) {
		logger.debug("⚠️ Iframe check failed, continuing...");
	}

	// Wait for SCORM-specific ready state
	await waitFor.scormReady(driver, 15000);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	logger.info(`⏱ SCORM click-to-load: ${seconds}s`);

	await logCurrentState(driver, "SCORM Content");
	await pauseForObservation(driver, "SCORM loaded", 1);

	return seconds;
}

export async function compareScorm(driver) {
	logger.info("🔬 SCORM Cache Comparison - Cold vs Warm in same session");

	// === ONE-TIME SETUP - LOGIN ===
	logger.info("🌐 Navigating to learner URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Login
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 20000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Open SCORM Cache"));

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
	logger.info("✅ Dashboard loaded");

	// Wait for dashboard to fully stabilize
	await waitFor.networkIdle(driver, 1000, 5000);

	// === COLD/WARM COMPARISON ===

	// COLD: First SCORM click
	logger.info("\n❄️  SCORM — COLD (first click)");
	const cold = await clickScormCard(driver);
	logResult("Open SCORM (cold)", cold);

	// Return to Dashboard
	logger.info("🔄 Clicking Back to Dashboard button...");
	try {
		const backBtn = await waitFor.element(driver, By.xpath("//button[contains(text(),'Back to Dashboard')]"), {
			timeout: 15000,
			visible: true,
			clickable: true,
			errorPrefix: 'Back to Dashboard button'
		});
		await waitFor.smartClick(driver, backBtn, { jsClickFallback: true });
	} catch (e) {
		logger.warn("⚠️ Back to Dashboard button not found, using fallback navigation...");
		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
	}

	// Wait for dashboard to load
	await waitFor.loginComplete(driver, 'learner', 20000);
	logger.info("✅ Dashboard loaded for warm test");

	// Wait for page to stabilize
	await waitFor.networkIdle(driver, 1000, 5000);

	// WARM: Second SCORM click (benefits from cache)
	logger.info("\n🔥 SCORM — WARM (second click, cached)");
	const warm = await clickScormCard(driver);
	logResult("Open SCORM (warm)", warm);

	// === CLEANUP ===
	await performLogout(driver, 'learner');

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	logger.always(`\n📊 SCORM Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result
	return warm;
}
