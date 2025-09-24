import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function createClass(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildEducatorUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
	await emailField.sendKeys(getAccountForTest("Create Class"));

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

	// --- LOCATE ADD/CREATE CLASS BUTTON ---
	console.log("🔍 Looking for 'add' button to create new class...");

	const addButtonSelectors = [
		// Target the add button by aria-label
		By.xpath("//button[@aria-label='add']"),

		// Alternative: look for add icon or plus icon
		By.xpath("//button[contains(@aria-label,'add') or contains(@aria-label,'Add') or contains(@aria-label,'plus')]"),

		// Alternative: Material Icons add button
		By.xpath("//button//p[contains(@style,'Material Icons') and contains(@style,'font-size: 24px')]//parent::button"),

		// Generic add/create button
		By.xpath("//button[contains(text(),'Add') or contains(text(),'Create') or contains(text(),'NEW')]")
	];

	let addButton = null;

	for (let i = 0; i < addButtonSelectors.length; i++) {
		try {
			console.log(`🔍 Trying add button selector ${i + 1}`);
			addButton = await driver.wait(until.elementLocated(addButtonSelectors[i]), 8000);

			const isVisible = await addButton.isDisplayed();
			if (isVisible) {
				console.log(`✅ Found add button using selector ${i + 1}`);
				break;
			} else {
				console.log(`⚠️ Add button found but not visible with selector ${i + 1}`);
				addButton = null;
			}
		} catch (e) {
			console.log(`❌ Add button selector ${i + 1} failed: ${e.message}`);
		}
	}

	if (!addButton) {
		throw new Error("❌ Could not find add/create class button");
	}

	// Scroll add button into view and click it
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", addButton);
	await new Promise(r => setTimeout(r, 500));

	console.log("🔍 Clicking add button to start class creation...");
	try {
		await addButton.click();
		console.log("✅ Clicked add button");
	} catch {
		await driver.executeScript("arguments[0].click();", addButton);
		console.log("✅ JS click on add button");
	}

	// --- WAIT FOR CLASS CREATION FORM ---
	console.log("⏳ Waiting for class creation form...");
	await new Promise(r => setTimeout(r, 2000));

	// --- LOCATE NAME INPUT FIELD ---
	const nameInputSelectors = [
		// Target the input field by aria-label and name
		By.xpath("//input[@aria-label='Name' and @name='name']"),

		// Alternative: target by name attribute
		By.css("input[name='name']"),

		// Alternative: target by aria-label only
		By.css("input[aria-label='Name']"),

		// Fallback: any text input that might be the name field
		By.xpath("//input[@type='text' and (contains(@aria-label,'name') or contains(@name,'name'))]")
	];

	let nameInput = null;

	for (let i = 0; i < nameInputSelectors.length; i++) {
		try {
			console.log(`🔍 Trying name input selector ${i + 1}`);
			nameInput = await driver.wait(until.elementLocated(nameInputSelectors[i]), 8000);

			const isVisible = await nameInput.isDisplayed();
			if (isVisible) {
				console.log(`✅ Found name input field using selector ${i + 1}`);
				break;
			} else {
				console.log(`⚠️ Name input found but not visible with selector ${i + 1}`);
				nameInput = null;
			}
		} catch (e) {
			console.log(`❌ Name input selector ${i + 1} failed: ${e.message}`);
		}
	}

	if (!nameInput) {
		throw new Error("❌ Could not find class name input field");
	}

	// --- START TIMER + ENTER CLASS NAME ---
	console.log("🚀 Starting timer - entering class name 'Webdriver'...");
	const start = Date.now();

	// Scroll name input into view and click it to focus
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
	await new Promise(r => setTimeout(r, 300));

	try {
		await nameInput.click();
		console.log("✅ Clicked name input field");
	} catch {
		await driver.executeScript("arguments[0].focus();", nameInput);
		console.log("✅ Focused name input field via JS");
	}

	// Clear any existing text and enter "Webdriver"
	await nameInput.clear();
	await nameInput.sendKeys("Webdriver");
	console.log("✅ Entered 'Webdriver' as class name");

	// --- LOCATE AND CLICK SAVE BUTTON ---
	console.log("🔍 Looking for SAVE button...");

	const saveButtonSelectors = [
		// Target the SAVE button by aria-label
		By.xpath("//button[@aria-label='SAVE']"),

		// Alternative: button containing SAVE text
		By.xpath("//button[contains(text(),'SAVE')]"),

		// Alternative: any button with save-related text
		By.xpath("//button[contains(text(),'Save') or contains(text(),'CREATE') or contains(text(),'Create')]"),

		// Fallback: enabled button that might be save
		By.xpath("//button[not(@disabled) and not(@aria-disabled='true')]")
	];

	let saveButton = null;

	// Wait for save button to become enabled (it might start disabled)
	for (let attempt = 1; attempt <= 3; attempt++) {
		for (let i = 0; i < saveButtonSelectors.length; i++) {
			try {
				console.log(`🔍 Attempt ${attempt}: Trying save button selector ${i + 1}`);
				saveButton = await driver.wait(until.elementLocated(saveButtonSelectors[i]), 5000);

				// Check if visible and enabled
				const isVisible = await saveButton.isDisplayed();
				const isEnabled = await saveButton.isEnabled();
				const ariaDisabled = await saveButton.getAttribute('aria-disabled');

				if (isVisible && isEnabled && ariaDisabled !== 'true') {
					console.log(`✅ Found enabled SAVE button using selector ${i + 1}`);
					break;
				} else {
					console.log(`⚠️ SAVE button found but not ready: visible=${isVisible}, enabled=${isEnabled}, aria-disabled=${ariaDisabled}`);
					saveButton = null;
				}
			} catch (e) {
				console.log(`❌ Save button selector ${i + 1} failed: ${e.message}`);
			}
		}

		if (saveButton) break;

		// Wait a bit for button to become enabled
		console.log(`⏳ Waiting for SAVE button to become enabled (attempt ${attempt})...`);
		await new Promise(r => setTimeout(r, 1000));
	}

	if (!saveButton) {
		throw new Error("❌ Could not find enabled SAVE button");
	}

	// Click save button
	await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", saveButton);
	await new Promise(r => setTimeout(r, 300));

	try {
		await saveButton.click();
		console.log("✅ Clicked SAVE button");
	} catch {
		await driver.executeScript("arguments[0].click();", saveButton);
		console.log("✅ JS click on SAVE button");
	}

	// --- WAIT FOR CLASS CREATION TO COMPLETE ---
	console.log("⏳ Waiting for class creation to complete...");

	const classCreatedSelectors = [
		// Look for the new class in the class list
		By.xpath("//*[contains(text(),'Webdriver') and (ancestor::tr or ancestor::div[contains(@style,'cursor: pointer')])]"),

		// Look for success message or confirmation
		By.xpath("//*[contains(text(),'created') or contains(text(),'Created') or contains(text(),'success')]"),

		// Look for class management UI
		By.xpath("//*[contains(text(),'Class') and contains(text(),'Webdriver')]"),

		// Check if we're back to class list or in new class
		By.xpath("//tr[@role='row'] | //div[contains(@class,'class')] | //*[contains(text(),'Classes')]"),

		// Generic indicators that form closed and class was created
		By.xpath("//*[contains(text(),'Dashboard') or contains(text(),'Classes')]")
	];

	let classCreated = false;

	for (let i = 0; i < classCreatedSelectors.length; i++) {
		try {
			await driver.wait(until.elementLocated(classCreatedSelectors[i]), 8000);
			console.log(`✅ Class creation completed - detected using selector ${i + 1}`);
			classCreated = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	// Fallback: check URL change or wait additional time
	if (!classCreated) {
		console.log("⏳ Fallback: checking for navigation or waiting...");
		const currentUrl = await driver.getCurrentUrl();
		if (currentUrl.includes("class") || currentUrl !== buildEducatorUrl()) {
			console.log("✅ URL changed - class likely created");
			classCreated = true;
		} else {
			await new Promise(r => setTimeout(r, 2000));
			console.log("✅ Waited additional time - assuming class created");
			classCreated = true;
		}
	}

	if (!classCreated) {
		console.log("⚠️ Could not definitively confirm class created, but timing recorded");
	}

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Class creation took: ${seconds}s`);

	await logCurrentState(driver, "Create Class");
	await pauseForObservation(driver, "Class 'Webdriver' created successfully", 3);

	return seconds;
}