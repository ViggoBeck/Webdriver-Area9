// src/workflows/deleteClassCache.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { logResult } from "../utils/log.js";

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
	} catch {
		console.log("⚠️ Could not perform scrollbar drag (element not found)");
	}
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

// ---------- single class deletion ----------
async function deleteSingleClass(driver, className) {
	console.log(`🎯 Measuring deletion of class '${className}'...`);

	// Reveal right-side columns (status / actions)
	await revealRightSide(driver);
	await tinyDragScrollbar(driver);

	// --- START TIMER ---
	const start = Date.now();

	// --- FIND ROW WITH BOTH NAME + STATUS ---
	console.log(`🔍 Looking for class '${className}' with status 'Inactive'...`);
	const row = await findRowWithNameAndStatus(driver, className, "Inactive").catch(() => null);
	if (!row) {
		throw new Error(`❌ No '${className}' class with status 'Inactive' found`);
	}
	console.log(`✅ Found row with '${className}' and status 'Inactive'`);

	// --- SAFETY CHECK: STATUS MUST BE INACTIVE ---
	const statusCells = await row.findElements(By.xpath(".//p[normalize-space()='Inactive']"));
	if (statusCells.length === 0) {
		throw new Error(`❌ Safety check failed: '${className}' class is not 'Inactive', aborting delete!`);
	}

	// --- DELETE BUTTON INSIDE ROW ---
	console.log(`🔍 Looking for delete button for '${className}' class...`);
	const delBtn = await row.findElement(By.xpath(".//button[@aria-label='delete']"));
	await safeClick(driver, delBtn);
	console.log(`✅ Successfully JS clicked delete icon for '${className}' class`);

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
	console.log("✅ Found confirm DELETE button using selector");
	await safeClick(driver, confirmBtn);
	console.log(`✅ Successfully clicked confirm deletion of '${className}' class`);

	// --- VERIFY DISAPPEARANCE BY CONTENT ---
	console.log("🔍 Verifying row is gone or status changed...");
	await driver.wait(async () => {
		const matches = await driver.findElements(
			By.xpath(`//*[@role='row' and .//p[normalize-space()='${className}'] and .//p[normalize-space()='Inactive']]`)
		);
		return matches.length === 0;
	}, 8000, `Row '${className}' with status 'Inactive' still present after deletion`);
	console.log(`✅ '${className}' (Inactive) class deleted`);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
	console.log(`⏱ Delete '${className}' took: ${seconds}s`);

	await logCurrentState(driver, "Delete Class Cache");
	await pauseForObservation(driver, `Class '${className}' deleted`, 1);

	return seconds;
}

// ---------- main comparison workflow ----------
export async function compareDeleteClass(driver) {
	console.log("🔬 Delete Class Cache Comparison - Cold vs Warm using repeated class deletion");

	// === ONE-TIME SETUP ===
	console.log("🌐 Logging in as educator...");
	await driver.get(buildEducatorUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	await emailField.sendKeys(getAccountForTest("Delete Class Cache"));

	const passwordField = await driver.findElement(By.css('input[name="password"]'));
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await driver.findElement(By.id("sign_in"));
	await signInBtn.click();
	await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

	// --- DASHBOARD ---
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(),'Educator') or contains(text(),'Dashboard') or contains(text(),'Classes')]")),
		DEFAULT_TIMEOUT
	);

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotItCandidates = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
		for (let btn of gotItCandidates) {
			if (await btn.isDisplayed()) {
				await driver.executeScript("arguments[0].click();", btn);
				await driver.wait(until.stalenessOf(btn), 10000);
				break;
			}
		}
	} catch {}

	console.log("✅ Educator dashboard loaded");

	// === COLD/WARM COMPARISON ===

	// COLD: First class deletion
	console.log("\n❄️  Delete Class — COLD (first deletion)");
	const cold = await deleteSingleClass(driver, "WebdriverCold").catch(err => {
		console.error(`❌ Cold deletion failed: ${err.message}`);
		throw err;
	});
	logResult("Delete Class (cold)", cold);

	// Small pause to let UI settle after first deletion
	console.log("🔄 Pausing for UI to settle after first deletion...");
	await new Promise(r => setTimeout(r, 2000));

	// WARM: Second class deletion (benefits from cache)
	console.log("\n🔥 Delete Class — WARM (second deletion, cached)");
	const warm = await deleteSingleClass(driver, "WebdriverWarm").catch(err => {
		console.error(`❌ Warm deletion failed: ${err.message}`);
		throw err;
	});
	logResult("Delete Class (warm)", warm);

	// === SUMMARY ===
	const diff = cold - warm;
	const pct = (diff / cold * 100).toFixed(1);
	console.log(`\n📊 Delete Class Cache Comparison Results:`);
	console.log(`   ❄️  Cold (first): ${cold.toFixed(3)}s`);
	console.log(`   🔥 Warm (cached): ${warm.toFixed(3)}s`);
	console.log(`   ⚡ Difference: ${diff.toFixed(3)}s (${pct}% improvement)`);

	// Return the warm time as the primary result (since cache tests are about optimization)
	return warm;
}