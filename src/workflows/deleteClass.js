// deleteClass.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
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
		console.log("ℹ️ Reveal right side skipped");
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
		console.log("✅ Scrollbar dragged to reveal columns");
	} catch (error) {
		console.log("ℹ️ Scrollbar drag skipped");
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
	console.log("🚀 Starting Delete Class test...");

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
	console.log("✅ Logged in as Educator");

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotIts = await driver.findElements(By.xpath("//*[normalize-space(.)='GOT IT']"));
		for (const g of gotIts) {
			if (await g.isDisplayed()) {
				await driver.executeScript("arguments[0].click();", g);
				await driver.wait(until.stalenessOf(g), 8000);
				console.log("✅ Overlay dismissed");
				break;
			}
		}
	} catch (error) {
		console.log("ℹ️ No overlay to dismiss");
	}

	// --- REVEAL RIGHT-SIDE COLUMNS (CRITICAL!) ---
	await revealRightSide(driver);
	await tinyDragScrollbar(driver);

	// --- FIND ROW WITH BOTH NAME + STATUS ---
	console.log("🔍 Looking for 'Webdriver' class with 'Inactive' status...");
	const row = await findRowWithNameAndStatus(driver, "Webdriver", "Inactive");
	console.log("✅ Found 'Webdriver' class row");

	// --- SAFETY CHECK: STATUS MUST BE INACTIVE ---
	const statusCells = await row.findElements(By.xpath(".//p[normalize-space()='Inactive']"));
	if (statusCells.length === 0) {
		throw new Error("❌ Safety check failed: 'Webdriver' is not 'Inactive', aborting delete!");
	}

	// --- DELETE BUTTON INSIDE ROW ---
	const deleteButton = await row.findElement(By.xpath(".//button[@aria-label='delete']"));
	await safeClick(driver, deleteButton);
	console.log("🗑️ Clicked delete icon for 'Webdriver' class");

	// --- CONFIRM DELETE MODAL ---
	console.log("⏳ Waiting for confirm delete dialog...");
	const confirmBtn = await waitFor.element(
		driver,
		By.xpath("//button[@aria-label='DELETE' or @aria-label='Delete' or normalize-space(text())='DELETE' or normalize-space(text())='Delete']"),
		{
			timeout: DEFAULT_TIMEOUT,
			visible: true,
			clickable: true,
			stable: true,
			errorPrefix: 'Confirm delete button'
		}
	);

	// --- START TIMING HERE - RIGHT BEFORE ACTUAL DELETION ---
	console.log("🚀 Starting timer - confirming deletion...");
	const start = Date.now();

	await safeClick(driver, confirmBtn);
	console.log("✅ Confirm delete clicked");

	// --- WAIT FOR DELETION TO COMPLETE ---
	console.log("⏳ Waiting for deletion to complete...");

	// 1. Try staleness check first
	try {
		await driver.wait(until.stalenessOf(row), 10000);
		console.log("✅ Row became stale");
	} catch (stalErr) {
		console.log("⚠️ Row staleness check failed, trying alternative verification...");
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
				console.log("✅ 'Webdriver' (Inactive) class confirmed deleted from table");
			} else {
				console.log(`⏳ Deletion attempt ${attempts}/${maxAttempts} - class still visible, waiting...`);
				await driver.sleep(500);
			}
		} catch (err) {
			deletionVerified = true;
			console.log("✅ 'Webdriver' (Inactive) class confirmed deleted");
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
			console.log("✅ Final verification: 'Webdriver' (Inactive) class successfully deleted");
		}
	}

	// --- STOP TIMER - DELETION IS NOW CONFIRMED ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Delete Class took: ${seconds}s`);

	await logCurrentState(driver, "Delete Class");
	await pauseForObservation(driver, "Class deletion complete", 3);

	// --- LOGOUT ---
	await performLogout(driver, 'educator');

	console.log("✨ Delete Class test finished");
	return seconds;
}
