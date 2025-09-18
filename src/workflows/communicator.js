import { By, until } from "selenium-webdriver";
import { performLogin, waitForSuccessfulLogin } from "../utils/login.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

async function waitForCommunicatorUI(driver) {
	// Look for communicator-specific elements
	const communicatorSelectors = [
		By.xpath("//*[contains(@class, 'communication')]"),
		By.xpath("//*[contains(@class, 'communicator')]"),
		By.xpath("//*[contains(text(), 'Inbox')]"),
		By.xpath("//*[contains(text(), 'Messages')]"),
		By.xpath("//*[contains(text(), 'Communication')]"),
		By.xpath("//*[contains(@class, 'message')]")
	];

	return await waitForSuccessfulLogin(driver, communicatorSelectors);
}

export async function communicatorLearner(driver) {
	// Use direct communicator URL during login (consistent with educator approach)
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]");

	// Wait for page to fully load
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Perform standard login
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Communicator Learner");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

	// Wait for communicator UI to load directly (no extra navigation needed)
	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Learner took:", seconds.toFixed(3), "seconds");

	// Handle overlay dismissal and logout after timing is complete
	await logCurrentState(driver, "Communicator Learner");
	await pauseForObservation(driver, "Communicator UI loaded", 2);

	// Dismiss any onboarding overlays
	await dismissLearnerOverlay(driver);

	// Perform logout
	await performLearnerLogout(driver);

	return seconds;
}

export async function communicatorEducator(driver) {
	// Use direct communicator URL during login (fixes navigation issue)
	console.log("🔐 Using direct communicator URL during login...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication");

	// Wait for page to fully load
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Perform standard login
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Communicator Educator");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

	// Wait for communicator UI to load directly (no extra navigation needed)
	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Educator tog:", seconds, "sekunder");
	return seconds;
}