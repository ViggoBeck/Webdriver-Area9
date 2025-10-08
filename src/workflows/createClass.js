// createClass.js - Using Smart Wait Utilities & Unified Auth
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { By, until } from "selenium-webdriver";
import { logger } from "../utils/logger.js";
import { getAccountForTest } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogin, performLogout } from "../utils/auth.js";

export async function createClass(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildEducatorUrl());

	const assignedAccount = getAccountForTest("Create Class");
	await performLogin(driver, 'educator', assignedAccount);

	// --- LOCATE ADD/CREATE CLASS BUTTON ---
	logger.info("🔍 Looking for 'add' button to create new class...");

	// Single robust selector with intelligent waiting - no more fallback chains
	const addButton = await waitFor.element(driver, selectorsFor.area9.addClassButton(), {
		timeout: 12000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'Add Class button'
	});

	logger.info("🔍 Clicking add button to start class creation...");
	await waitFor.smartClick(driver, addButton);

	// --- WAIT FOR CLASS CREATION FORM ---
	logger.info("⏳ Waiting for class creation form...");

	// Wait for form to be ready instead of hardcoded 2-second delay
	await waitFor.formReady(driver, 'form, .form, [role="dialog"]', {
		timeout: 10000,
		requiredFields: ['input[name="name"], input[aria-label="Name"]'],
		errorPrefix: 'Class creation form'
	});

	// --- LOCATE NAME INPUT FIELD ---
	logger.info("🔍 Looking for name input field...");

	// Single robust selector
	const nameInput = await waitFor.element(driver, selectorsFor.area9.classNameInput(), {
		timeout: 8000,
		visible: true,
		clickable: true,
		errorPrefix: 'Class name input field'
	});

	// --- START TIMER + ENTER CLASS NAME ---
	logger.info("🚀 Starting timer - entering class name 'Webdriver'...");
	const start = Date.now();

	// Smart click handles focus automatically
	await waitFor.smartClick(driver, nameInput);
	await nameInput.clear();
	await nameInput.sendKeys("Webdriver");
	logger.info("✅ Entered 'Webdriver' as class name");

	// --- LOCATE AND CLICK SAVE BUTTON ---
	logger.info("🔍 Looking for SAVE button...");

	// Smart waiting for button to be enabled and clickable
	const saveButton = await waitFor.element(driver, selectorsFor.area9.saveButton(), {
		timeout: 10000,
		visible: true,
		clickable: true,
		stable: true,
		errorPrefix: 'SAVE button'
	});

	logger.info("🔍 Clicking SAVE button...");
	await waitFor.smartClick(driver, saveButton);

	// --- WAIT FOR CLASS CREATION TO COMPLETE ---
	logger.info("⏳ Waiting for class creation to complete...");

	// Application-specific completion detection
	await waitFor.classOperation(driver, 'create', 'Webdriver', 15000);

	// --- STOP TIMER ---
	const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
	logger.info(`⏱ Class creation took: ${seconds}s`);

	await logCurrentState(driver, "Create Class");
	await pauseForObservation(driver, "Class 'Webdriver' created successfully", 3);

	// --- LOGOUT (using unified auth) ---
	await performLogout(driver, 'educator');

	return seconds;
}
