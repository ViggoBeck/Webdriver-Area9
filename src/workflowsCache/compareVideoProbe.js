// src/workflowsCache/compareVideoProbe.js
// Cache comparison workflow with smart waits, session management, and retry logic

import { By } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { logResult } from "../utils/log.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { logger } from "../utils/logger.js";

/** Single Video Probe card click measurement (assumes already on dashboard) */
async function clickVideoProbeCard(driver) {
	logger.info("🎯 Measuring Video Probe card click to load...");

	// --- FIND VIDEO BENCHMARK CARD ---
	const videoCardXPath = `
		//p[normalize-space()='1 Video Benchmark Test']
		/ancestor::div[contains(@class,'nativeWidget')]
		//button[@aria-label='1 Video' and not(@disabled)]
	`;

	// --- FIND AND CLICK VIDEO CARD WITH AGGRESSIVE STRATEGY ---
	logger.debug("🎯 Looking for Video card with aggressive detection...");

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

	let videoBtn = null;

	// Try to find element
	try {
		videoBtn = await waitFor.element(driver, By.xpath(videoCardXPath), {
			timeout: 8000,
			visible: true,
			stable: true,
			errorPrefix: 'Video Benchmark Test card'
		});
		logger.info("✅ Found Video Benchmark Test card");
	} catch (e) {
		logger.error("❌ Video card not found on dashboard");
		throw new Error("Video Benchmark Test card not visible on dashboard");
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
	`, videoBtn);

	// Longer settle time after scroll
	await new Promise(r => setTimeout(r, 1500));
	logger.debug("✅ Scrolled and settled");

	// --- START TIMER: Before clicking ---
	const start = Date.now();

	// --- CLICK VIDEO CARD WITH JAVASCRIPT (MOST RELIABLE) ---
	logger.debug("🖱️ Clicking Video card...");

	try {
		// Use JavaScript click directly for most reliability
		await driver.executeScript("arguments[0].click();", videoBtn);
		logger.info(`✅ Video card clicked successfully`);
	} catch (e) {
		logger.error(`❌ Video card click failed: ${e.message}`);
		throw new Error(`Video card click failed: ${e.message}`);
	}

	// --- WAIT FOR VIDEO CONTENT TO LOAD ---
	logger.info("⏳ Waiting for video content to load...");

	// Wait for URL change first (navigation to video content)
	try {
		await driver.wait(async () => {
			const url = await driver.getCurrentUrl();
			return url.includes('card=') || url.includes('video');
		}, 8000);
		logger.debug("✅ URL changed - Video navigation detected");
	} catch (e) {
		logger.debug("⚠️ URL didn't change, checking for video element...");
	}

	// Wait for network to settle after navigation
	await waitFor.networkIdle(driver, 1500, 8000);

	// Wait for video element or iframe to be present
	try {
		await waitFor.element(driver, By.css('video, iframe[src*="video"], iframe[src*="youtube"], iframe[src*="vimeo"]'), {
			timeout: 10000,
			visible: true,
			errorPrefix: 'Video element or iframe'
		});
		logger.debug("✅ Video element/iframe detected");
	} catch (e) {
		logger.debug("⚠️ Video element detection inconclusive");
	}

	// Wait for video to be ready to play
	try {
		await driver.wait(async () => {
			return await driver.executeScript(`
				const video = document.querySelector('video');
				if (video) {
					return video.readyState >= 2; // HAVE_CURRENT_DATA or higher
				}

				// If no direct video element, check for iframe
				const iframe = document.querySelector('iframe[src*="video"], iframe[src*="youtube"], iframe[src*="vimeo"]');
				return iframe !== null;
			`);
		}, 5000);
		logger.debug("✅ Video content ready");
	} catch (e) {
		logger.debug("⚠️ Video ready state check timeout, assuming loaded");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	logger.info(`⏱ Video probe load took: ${seconds}s`);

	await logCurrentState(driver, "Video Content");
	await pauseForObservation(driver, "Video loaded", 1);

	return seconds;
}

export async function compareVideoProbe(driver) {
	logger.info("🔬 Video Probe Cache Comparison - Cold vs Warm in same session");

	// === ONE-TIME SETUP - LOGIN ===
	logger.info("🌐 Navigating to learner URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Login
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 20000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Video Probe Cache"));

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

	// COLD: First Video click
	logger.info("\n❄️  Video Probe — COLD (first click)");
	const cold = await clickVideoProbeCard(driver);
	logResult("Open Video Probe (cold)", cold);

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

	// WARM: Second Video click (benefits from cache)
	logger.info("\n🔥 Video Probe — WARM (second click, cached)");
	const warm = await clickVideoProbeCard(driver);
	logResult("Open Video Probe (warm)", warm);

	// === CLEANUP ===
	await performLogout(driver, 'learner');

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	logger.always(`\n📊 Video Probe Cache Comparison Results:`);
	logger.always(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	logger.always(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	logger.always(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result
	return warm;
}
