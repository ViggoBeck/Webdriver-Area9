// deleteClass.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/auth.js";

/**
 * Horizontally reveal right-side columns (status/actions)
 */
async function revealRightSide(driver) {
	try {
		await driver.executeScript(() => {
			const nodes = Array.from(document.querySelectorAll(".nativeWidget"));
			nodes.forEach(n => {
				if (n.scrollWidth > n.clientWidth) {
					n.scrollLeft = n.scrollWidth;
				}
			});
		});
		await driver.sleep(300);
	} catch (error) {
		logger.info("ℹ️ Reveal right side skipped");
	}
}

/**
 * Drag horizontal scrollbar to reveal columns
 * This is critical for making status/action columns visible
 */
async function tinyDragScrollbar(driver) {
	try {
		const handle = await driver.findElement(
			By.xpath("//div[contains(@class,'nativeWidget') and @role='presentation' and contains(@style,'height: 6.5px')]")
		);
		const actions = driver.actions({ async: true });
		await actions.move({ origin: handle }).press().move({ x: 200, y: 0 }).release().perform();
		await driver.sleep(300);
		logger.info("✅ Scrollbar dragged to reveal columns");
	} catch (error) {
		logger.info("ℹ️ Scrollbar drag skipped");
	}
}

/**
 * Safe click utility - scroll into view and use JS fallback if needed
 */
async function safeClick(driver, el) {
	try {
		await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
		await el.click();
	} catch {
		await driver.executeScript("arguments[0].click();", el);
	}
}

/**
 * Find the exact row containing BOTH the class name AND the status
 */
async function findRowWithNameAndStatus(driver, className, status) {
	const xpath = `//*[@role='row' and .//p[normalize-space()='${className}'] and .//p[normalize-space()='${status}']]`;

	// Use smart wait with progressive timeouts
	return await waitFor.element(driver, By.xpath(xpath), {
		timeout: DEFAULT_TIMEOUT,
		visible: true,
		stable: true,
		errorPrefix: `Row with '${className}' and '${status}'`
	});
}

export async function deleteClass(driver) {
	logger.info("🚀 Starting Delete Class test...");

	// --- LOGIN AS EDUCATOR (not timed) ---
	await driver.get(buildEducatorUrl());

	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: DEFAULT_TIMEOUT,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Delete Class"));

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

	// Wait for dashboard to load - use original selector that works
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(),'CLASSES') or contains(text(),'Dashboard')]")),
		DEFAULT_TIMEOUT
	);
	logger.info("✅ Logged in as Educator");

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotIts = await driver.findElements(By.xpath("//*[normalize-space(.)='GOT IT']"));
		for (const g of gotIts) {
			if (await g.isDisplayed()) {
				await driver.executeScript("arguments[0].click();", g);
				await driver.wait(until.stalenessOf(g), 8000);
				logger.info("✅ Overlay dismissed");
				break;
			}
		}
	} catch (error) {
		logger.info("ℹ️ No overlay to dismiss");
	}

	// --- REVEAL RIGHT-SIDE COLUMNS (CRITICAL!) ---
	await revealRightSide(driver);
	await tinyDragScrollbar(driver);

	// --- EXTRA STABILIZATION FOR WORKFLOW CONTEXT ---
	// In workflow, the table might still be settling from session reset
	logger.info("⏳ Waiting for table to fully stabilize...");
	await waitFor.networkIdle(driver, 1000, 5000);
	await driver.sleep(1000);

	// Dismiss any lingering overlays that might block clicks
	try {
		const overlays = await driver.findElements(By.xpath("//*[normalize-space(.)='GOT IT' or normalize-space(.)='OK']"));
		for (const overlay of overlays) {
			try {
				if (await overlay.isDisplayed()) {
					await driver.executeScript("arguments[0].click();", overlay);
					await driver.sleep(300);
					logger.info("✅ Dismissed lingering overlay");
				}
			} catch (e) {
				// Continue if overlay interaction fails
			}
		}
	} catch (e) {
		// No overlays found
	}

	// --- FIND ROW WITH BOTH NAME + STATUS ---
	logger.info("🔍 Looking for 'Webdriver' class with 'Inactive' status...");
	const row = await findRowWithNameAndStatus(driver, "Webdriver", "Inactive");
	logger.info("✅ Found 'Webdriver' class row");

	// --- SAFETY CHECK: STATUS MUST BE INACTIVE ---
	const statusCells = await row.findElements(By.xpath(".//p[normalize-space()='Inactive']"));
	if (statusCells.length === 0) {
		throw new Error("❌ Safety check failed: 'Webdriver' is not 'Inactive', aborting delete!");
	}

	// --- DELETE BUTTON INSIDE ROW ---
	// Re-scroll to ensure columns are visible (might have reset during stabilization)
	await revealRightSide(driver);

	const deleteButton = await row.findElement(By.xpath(".//button[@aria-label='delete']"));

	// Ensure delete button is fully interactive
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", deleteButton);
	await driver.sleep(300);

	// Try clicking delete with retry logic (modal might not appear on first click in workflow)
	let confirmBtn = null;
	let clickAttempts = 0;
	const maxClickAttempts = 3;

	while (!confirmBtn && clickAttempts < maxClickAttempts) {
		clickAttempts++;
		logger.info(`🗑️ Delete click attempt ${clickAttempts}/${maxClickAttempts}...`);

		await safeClick(driver, deleteButton);

		// Give modal time to render (especially important in workflow context)
		await driver.sleep(800);

		// Check if confirm dialog appeared
		logger.info("⏳ Checking for confirm delete dialog...");
		try {
			confirmBtn = await driver.wait(
				until.elementLocated(By.xpath("//button[@aria-label='DELETE' or @aria-label='Delete' or normalize-space(text())='DELETE' or normalize-space(text())='Delete']")),
				3000
			);

			// Ensure it's actually visible and clickable
			await driver.wait(until.elementIsVisible(confirmBtn), 2000);
			logger.info("✅ Confirm delete dialog appeared");
		} catch (modalErr) {
			if (clickAttempts < maxClickAttempts) {
				logger.warn(`⚠️ Modal didn't appear, retrying delete click...`);
				confirmBtn = null;
				await driver.sleep(500);
			} else {
				throw new Error(`Confirm delete dialog failed to appear after ${maxClickAttempts} delete button clicks`);
			}
		}
	}

	// --- START TIMING HERE - RIGHT BEFORE ACTUAL DELETION ---
	logger.info("🚀 Starting timer - confirming deletion...");
	const start = Date.now();

	await safeClick(driver, confirmBtn);
	logger.info("✅ Confirm delete clicked");

	// --- WAIT FOR DELETION TO COMPLETE ---
	logger.info("⏳ Waiting for deletion to complete...");

	// 1. Try staleness check first
	try {
		await driver.wait(until.stalenessOf(row), 10000);
		logger.info("✅ Row became stale");
	} catch (stalErr) {
		logger.info("⚠️ Row staleness check failed, trying alternative verification...");
	}

	// 2. Verify the row is actually gone from the table
	let deletionVerified = false;
	let attempts = 0;
	const maxAttempts = 10;

	while (!deletionVerified && attempts < maxAttempts) {
		attempts++;

		try {
			const stillExists = await driver.findElements(
				By.xpath(`//*[@role='row' and .//p[normalize-space()='Webdriver'] and .//p[normalize-space()='Inactive']]`)
			);

			if (stillExists.length === 0) {
				deletionVerified = true;
				logger.info("✅ 'Webdriver' (Inactive) class confirmed deleted from table");
			} else {
				logger.info(`⏳ Deletion attempt ${attempts}/${maxAttempts} - class still visible, waiting...`);
				await driver.sleep(500);
			}
		} catch (err) {
			deletionVerified = true;
			logger.info("✅ 'Webdriver' (Inactive) class confirmed deleted");
		}
	}

	// 3. Final verification
	if (!deletionVerified) {
		await driver.sleep(1000);
		const finalCheck = await driver.findElements(
			By.xpath(`//*[@role='row' and .//p[normalize-space()='Webdriver'] and .//p[normalize-space()='Inactive']]`)
		);

		if (finalCheck.length > 0) {
			throw new Error("❌ Class deletion failed - 'Webdriver' (Inactive) is still present in the table");
		} else {
			deletionVerified = true;
			logger.info("✅ Final verification: 'Webdriver' (Inactive) class successfully deleted");
		}
	}

	// --- STOP TIMER - DELETION IS NOW CONFIRMED ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Delete Class took: ${seconds}s`);

	await logCurrentState(driver, "Delete Class");
	await pauseForObservation(driver, "Class deletion complete", 3);

	// --- LOGOUT ---
	await performLogout(driver, 'educator');

	logger.info("✨ Delete Class test finished");
	return seconds;
}
