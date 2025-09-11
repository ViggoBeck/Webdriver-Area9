import { By, until } from "selenium-webdriver";
import { performLogin, waitForSuccessfulLogin } from "../utils/login.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";

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
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]");

	// Use the REAL selectors found by debugging
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[type="email"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Communicator Learner");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[type="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Use the REAL login button selector
	const signInButton = await driver.wait(
		until.elementLocated(By.css('button[type="submit"]')),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Learner tog:", seconds, "sekunder");
	return seconds;
}

export async function communicatorEducator(driver) {
	// Always do regular educator login first, then navigate to communication
	// This avoids the complex detection logic that was causing issues

	console.log("🔐 Using standard educator login flow...");
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Use the REAL selectors found by debugging
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[type="email"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Communicator Educator");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[type="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Use the REAL login button selector
	const signInButton = await driver.wait(
		until.elementLocated(By.css('button[type="submit"]')),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

	await waitForSuccessfulLogin(driver);

	// Now navigate to communication
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication");

	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Educator tog:", seconds, "sekunder");
	return seconds;
}