// src/workflows/deleteClass.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

/** Try to horizontally reveal right-side columns (works for most HTML scroll containers). */
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
		await new Promise(r => setTimeout(r, 300));
	} catch {}
}

/** Best-effort tiny drag on the thin horizontal handle if it exists. */
async function tinyDragScrollbar(driver) {
	try {
		const handle = await driver.findElement(
			By.xpath("//div[contains(@class,'nativeWidget') and @role='presentation' and contains(@style,'height: 6.5px')]")
		);
		const actions = driver.actions({ async: true });
		await actions.move({ origin: handle }).press().move({ x: 200, y: 0 }).release().perform();
		await new Promise(r => setTimeout(r, 300));
	} catch {}
}

/** Utility: safe click */
async function safeClick(driver, el) {
	try {
		await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
		await el.click();
	} catch {
		await driver.executeScript("arguments[0].click();", el);
	}
}

/** Find the exact row: role='row' that contains BOTH the class name AND the status. */
async function findRowWithNameAndStatus(driver, className, status, timeout = DEFAULT_TIMEOUT) {
	const xpath =
		`//*[@role='row' and .//p[normalize-space()='${className}'] and .//p[normalize-space()='${status}']]`;
	return driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
}

export async function deleteClass(driver) {
	console.log("🚀 Starting Delete Class test...");

	// --- LOGIN AS EDUCATOR ---
	await driver.get(buildEducatorUrl());

	const email = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	await email.sendKeys(getAccountForTest("Delete Class"));

	const pw = await driver.findElement(By.css('input[name="password"]'));
	await pw.sendKeys(DEFAULT_PASSWORD);

	const btn = await driver.findElement(By.id("sign_in"));
	await btn.click();
	await driver.wait(until.stalenessOf(btn), DEFAULT_TIMEOUT).catch(() => {});

	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(),'CLASSES') or contains(text(),'Dashboard')]")),
		DEFAULT_TIMEOUT
	);
	console.log("✅ Logged in as Educator");

	// Dismiss onboarding if present
	try {
		const gotIts = await driver.findElements(By.xpath("//*[normalize-space(.)='GOT IT']"));
		for (const g of gotIts) {
			if (await g.isDisplayed()) {
				await driver.executeScript("arguments[0].click();", g);
				await driver.wait(until.stalenessOf(g), 8000);
				break;
			}
		}
	} catch {}

	// Reveal right-side columns (status / actions)
	await revealRightSide(driver);
	await tinyDragScrollbar(driver);

	// --- FIND ROW WITH BOTH NAME + STATUS ---
	const row = await findRowWithNameAndStatus(driver, "Webdriver", "Inactive").catch(() => null);
	if (!row) throw new Error("❌ No 'Webdriver' class with status 'Inactive' found");

	// --- SAFETY CHECK: STATUS MUST BE INACTIVE ---
	const statusCells = await row.findElements(By.xpath(".//p[normalize-space()='Inactive']"));
	if (statusCells.length === 0) {
		throw new Error("❌ Safety check failed: 'Webdriver' is not 'Inactive', aborting delete!");
	}

	// --- DELETE BUTTON INSIDE ROW ---
	const delBtn = await row.findElement(By.xpath(".//button[@aria-label='delete']"));
	await safeClick(driver, delBtn);
	console.log("🗑️ Clicked delete icon for 'Webdriver' class");

	// --- CONFIRM DELETE MODAL ---
	console.log("⏳ Waiting for confirm delete dialog...");
	const confirmBtn = await driver.wait(
		until.elementLocated(
			By.xpath(
				"//button[@aria-label='DELETE' or @aria-label='Delete' or normalize-space(text())='DELETE' or normalize-space(text())='Delete']"
			)
		),
		DEFAULT_TIMEOUT
	);

	// --- START TIMING HERE - RIGHT BEFORE ACTUAL DELETION ---
	const start = Date.now();
	await safeClick(driver, confirmBtn);
	console.log("✅ Confirm delete clicked");

	// --- ROBUST VERIFICATION OF DELETION ---
	// 1. Wait for the row to become stale first
	try {
		await driver.wait(until.stalenessOf(row), 10000);
	} catch (stalErr) {
		// If stale doesn't work, continue to other verification methods
		console.log("⚠️ Row staleness check failed, trying alternative verification...");
	}

	// 2. Wait for the class to actually disappear from the table
	let deletionVerified = false;
	let attempts = 0;
	const maxAttempts = 10;

	while (!deletionVerified && attempts < maxAttempts) {
		attempts++;

		try {
			// Try to find the row again - if it's gone, deletion succeeded
			const stillExists = await driver.findElements(
				By.xpath(`//*[@role='row' and .//p[normalize-space()='Webdriver'] and .//p[normalize-space()='Inactive']]`)
			);

			if (stillExists.length === 0) {
				deletionVerified = true;
				console.log("✅ 'Webdriver' (Inactive) class confirmed deleted from table");
			} else {
				console.log(`⏳ Deletion attempt ${attempts}/${maxAttempts} - class still visible, waiting...`);
				await new Promise(r => setTimeout(r, 500)); // Wait 500ms before next check
			}
		} catch (err) {
			// Error finding elements is also good - means it's gone
			deletionVerified = true;
			console.log("✅ 'Webdriver' (Inactive) class confirmed deleted (element search failed)");
		}
	}

	// 3. Final verification - double-check that no "Webdriver" + "Inactive" row exists
	if (!deletionVerified) {
		// One more thorough check
		await new Promise(r => setTimeout(r, 1000)); // Final wait
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

	console.log("✨ Delete Class test finished");
	return seconds;
}
 