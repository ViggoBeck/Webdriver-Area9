import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissOverlays, performLogout } from "../utils/auth.js";
import { logResult } from "../utils/log.js";

// Single Course Catalog access from menu (assumes already on dashboard)
async function openCourseCatalogFromMenu(driver) {
	console.log("🎯 Measuring Course Catalog menu access...");

	// --- OPEN MENU WITH ROBUST RETRY LOGIC (same as openCourseCatalog.js) ---
	console.log("🍔 Opening menu for Course Catalog access...");
	let menuBtn = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			// Dismiss any overlays that might interfere (only on retry attempts)
			if (attempt > 1) {
				await dismissOverlays(driver, "(before menu retry)");
			}

			menuBtn = await driver.wait(
				until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
				10000
			);
			await driver.wait(until.elementIsVisible(menuBtn), 2000);

			// Use JavaScript click for reliability
			await driver.executeScript("arguments[0].click();", menuBtn);
			console.log(`✅ Menu opened successfully`);
			break;
		} catch (e) {
			console.log(`⚠️ Menu open failed (attempt ${attempt}): ${e.message}`);
			if (attempt < 3) {
				await new Promise(r => setTimeout(r, 1000));
			}
		}
	}

	if (!menuBtn) {
		throw new Error("❌ Could not open menu for Course Catalog access");
	}

	// Wait for menu to fully appear
	await new Promise(resolve => setTimeout(resolve, 1000));

	// --- FIND AND CLICK COURSE CATALOG WITH ROBUST RETRY (same logic) ---
	console.log("📚 Looking for Course Catalog button...");
	let catalogBtn = null;

	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			// Dismiss any overlays that might have appeared when menu opened (only on retries)
			if (attempt > 1) {
				await dismissOverlays(driver, "(before catalog retry)");
			}

			catalogBtn = await driver.wait(
				until.elementLocated(By.xpath("//button[@aria-label='COURSE CATALOG']")),
				10000
			);
			await driver.wait(until.elementIsVisible(catalogBtn), 5000);

			// Scroll into view
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", catalogBtn);
			await new Promise(r => setTimeout(r, 1000));

			console.log(`✅ Course Catalog button found, starting timer...`);
			break;

		} catch (e) {
			console.log(`⚠️ Course Catalog click failed (attempt ${attempt}): ${e.message}`);
			if (attempt < 3) {
				await new Promise(r => setTimeout(r, 1000));
			}
		}
	}

	if (!catalogBtn) {
		throw new Error("❌ Could not click Course Catalog button after 3 attempts");
	}

	// START TIMER: Right before clicking (after button is found and ready)
	const start = Date.now();

	// Click the button
	await driver.executeScript("arguments[0].click();", catalogBtn);
	console.log(`✅ Course Catalog clicked successfully`);

	// --- VERIFY CATALOG CONTENT LOADED - Wait for URL change first ---
	console.log("📚 Verifying Course Catalog content loaded...");
	let loaded = false;

	// Primary: Wait for URL to change to courses (most reliable indicator)
	try {
		await driver.wait(async () => {
			const url = await driver.getCurrentUrl();
			return url.includes("courses") || url.includes("catalog");
		}, 10000);
		console.log("✅ Course Catalog URL detected");

		// Additional wait to ensure content is fully loaded
		await new Promise(resolve => setTimeout(resolve, 1000));
		loaded = true;
	} catch {
		console.log("⚠️ URL change not detected, trying fallback...");
	}

	// Fallback: Look for specific course catalog content (not generic "Course" text)
	if (!loaded) {
		try {
			await driver.wait(
				until.elementLocated(By.xpath("//*[contains(text(),'Browse') or contains(text(),'Search') or contains(@class,'course-card') or contains(@class,'catalog-')]")),
				5000
			);
			console.log("✅ Course Catalog content detected");
			loaded = true;
		} catch {
			console.log("⚠️ Specific catalog content not found");
		}
	}

	if (!loaded) {
		throw new Error("❌ Course Catalog did not load in time - no content detected");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ Course Catalog load took: ${seconds}s`);

	await logCurrentState(driver, "Course Catalog Access");
	await pauseForObservation(driver, "Course Catalog content loaded", 1);

	return seconds;
}

export async function compareCourseCatalog(driver) {
	console.log("🔬 Course Catalog Cache Comparison - Cold vs Warm using menu navigation");

	// === ONE-TIME SETUP ===
	console.log("🌐 Navigating to learner URL...");
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), 20000);
	await emailField.sendKeys(getAccountForTest("Course Catalog Cache"));

	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await driver.findElement(By.id("sign_in"));
	await signInBtn.click();
	await driver.wait(until.stalenessOf(signInBtn), 15000).catch(() => {});

	// --- DASHBOARD ---
	await driver.wait(until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")), 30000);
	console.log("✅ Dashboard loaded successfully");

	// --- INITIAL OVERLAY DISMISSAL ---
	await dismissOverlays(driver, "(after login)");
	await new Promise(resolve => setTimeout(resolve, 1000));

	// === COLD/WARM COMPARISON ===

	// COLD: First Course Catalog access
	console.log("\n❄️  Course Catalog — COLD (first access)");
	const cold = await openCourseCatalogFromMenu(driver);
	logResult("Open Course Catalog (cold)", cold);

	// Return to Dashboard using user's specified button
	console.log("🔄 Returning to Dashboard via menu...");

	// Open menu first
	let menuBtn = await driver.wait(
		until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
		10000
	);
	await driver.wait(until.elementIsVisible(menuBtn), 2000);
	await driver.executeScript("arguments[0].click();", menuBtn);
	console.log("✅ Menu opened for Dashboard navigation");

	// Wait for menu to appear
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Click Dashboard button (user's specified button)
	let dashboardBtn;
	try {
		dashboardBtn = await driver.wait(
			until.elementLocated(By.css('button[aria-label="Dashboard"]')),
			10000
		);
		await driver.wait(until.elementIsVisible(dashboardBtn), 5000);
		await driver.executeScript("arguments[0].click();", dashboardBtn);
		console.log("✅ Dashboard button clicked");
	} catch (e) {
		console.log("⚠️ Dashboard button not found, using fallback navigation...");
		// Fallback: direct navigation to dashboard
		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
	}

	// Wait for dashboard to load
	await driver.wait(until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")), 20000);
	console.log("✅ Dashboard loaded for warm test");

	// Small pause to let page settle
	await new Promise(r => setTimeout(r, 2000));

	// WARM: Second Course Catalog access (benefits from cache)
	console.log("\n🔥 Course Catalog — WARM (second access, cached)");
	const warm = await openCourseCatalogFromMenu(driver);
	logResult("Open Course Catalog (warm)", warm);

	// === CLEANUP ===
	await performLogout(driver, 'learner');

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	console.log(`\n📊 Course Catalog Cache Comparison Results:`);
	console.log(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	console.log(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	console.log(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result (since cache tests are about optimization)
	return warm;
}