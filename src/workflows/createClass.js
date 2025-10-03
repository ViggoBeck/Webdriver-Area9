// createClass.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function createClass(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildEducatorUrl());

	// Use smart waiting instead of hardcoded DEFAULT_TIMEOUT
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(getAccountForTest("Create Class"));

	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInBtn = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// Smart click handles scrolling and fallback to JS click automatically
	await waitFor.smartClick(driver, signInBtn);

	// Wait for login to complete instead of checking staleness
	await waitFor.loginComplete(driver, 'educator');

	// --- DISMISS OVERLAY IF PRESENT ---
	try {
		const gotItButton = await waitFor.element(driver, selectorsFor.area9.gotItButton(), {
			timeout: 3000,
			visible: true,
			errorPrefix: 'Got It overlay button'
		});
		await waitFor.smartClick(driver, gotItButton);
		console.log("✅ Overlay dismissed");
	} catch (error) {
		console.log("ℹ️ No overlay to dismiss");
	}

	// --- LOCATE ADD/CREATE CLASS BUTTON ---
	console.log("🔍 Looking for 'add' button to create new class...");

	// Single robust selector with intelligent waiting - no more fallback chains
	const addButton = await waitFor.element(driver, selectorsFor.area9.addClassButton(), {
		timeout: 12000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Add Class button'
	});

	console.log("🔍 Clicking add button to start class creation...");
	await waitFor.smartClick(driver, addButton);

	// --- WAIT FOR CLASS CREATION FORM ---
	console.log("⏳ Waiting for class creation form...");

	// Wait for form to be ready instead of hardcoded 2-second delay
	await waitFor.formReady(driver, 'form, .form, [role="dialog"]', {
		timeout: 10000,
		requiredFields: ['input[name="name"], input[aria-label="Name"]'],
		errorPrefix: 'Class creation form'
	});

	// --- LOCATE NAME INPUT FIELD ---
	console.log("🔍 Looking for name input field...");

	// Single robust selector
	const nameInput = await waitFor.element(driver, selectorsFor.area9.classNameInput(), {
		timeout: 8000,
		visible: true,
		clickable: true,
		errorPrefix: 'Class name input field'
	});

	// --- START TIMER + ENTER CLASS NAME ---
	console.log("🚀 Starting timer - entering class name 'Webdriver'...");
	const start = Date.now();

	// Smart click handles focus automatically
	await waitFor.smartClick(driver, nameInput);
	await nameInput.clear();
	await nameInput.sendKeys("Webdriver");
	console.log("✅ Entered 'Webdriver' as class name");

	// --- LOCATE AND CLICK SAVE BUTTON ---
	console.log("🔍 Looking for SAVE button...");

	// Smart waiting for button to be enabled and clickable
	const saveButton = await waitFor.element(driver, selectorsFor.area9.saveButton(), {
		timeout: 10000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'SAVE button'
	});

	console.log("🔍 Clicking SAVE button...");
	await waitFor.smartClick(driver, saveButton);

	// --- WAIT FOR CLASS CREATION TO COMPLETE ---
	console.log("⏳ Waiting for class creation to complete...");

	// Application-specific completion detection
	await waitFor.classOperation(driver, 'create', 'Webdriver', 15000);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	console.log(`⏱ Class creation took: ${seconds}s`);

	await logCurrentState(driver, "Create Class");
	await pauseForObservation(driver, "Class 'Webdriver' created successfully", 3);

	return seconds;
}
