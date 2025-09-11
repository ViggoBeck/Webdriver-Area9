import { By, until } from "selenium-webdriver";

async function performLogin(driver, email, testName) {
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys(email);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys("P@ssw0rd1234");

	// Flexible sign in button detection
	let signInButton;
	const buttonSelectors = [
		By.id("sign_in"),
		By.xpath("//*[contains(text(), 'SIGN IN')]"),
		By.xpath("//button[contains(text(), 'SIGN IN')]"),
		By.css("button[type='submit']"),
		By.xpath("//input[@type='submit']")
	];

	for (const selector of buttonSelectors) {
		try {
			signInButton = await driver.wait(until.elementLocated(selector), 5000);
			await driver.wait(until.elementIsEnabled(signInButton), 2000);
			break;
		} catch (e) {
			// Try next selector
		}
	}

	if (!signInButton) {
		throw new Error(`Could not find sign in button for ${testName}`);
	}

	await signInButton.click();
}

async function waitForCommunicatorUI(driver) {
	// Look for communicator-specific elements
	const communicatorSelectors = [
		By.xpath("//*[contains(@class, 'communication')]"),
		By.xpath("//*[contains(@class, 'communicator')]"),
		By.xpath("//*[contains(text(), 'Inbox')]"),
		By.xpath("//*[contains(text(), 'Messages')]"),
		By.xpath("//*[contains(text(), 'Communication')]"),
		By.xpath("//*[contains(@class, 'message')]"),
		By.xpath("//nav | //header"),
		By.xpath("//*[contains(@class, 'main-content')]")
	];

	for (const selector of communicatorSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ Communicator UI detected via: ${selector}`);
			return true;
		} catch (e) {
			// Try next selector
		}
	}

	// Fallback: check if login form is gone
	await new Promise(resolve => setTimeout(resolve, 2000));
	const loginForms = await driver.findElements(By.css('input[name="username"]'));
	if (loginForms.length === 0) {
		console.log("✅ Login form disappeared - assuming communicator loaded");
		return true;
	}

	throw new Error("Could not verify communicator UI loaded");
}

export async function communicatorLearner(driver) {
	const start = Date.now();

	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]");

	await performLogin(driver, "A9-106821@area9.dk", "Communicator Learner");
	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Learner tog:", seconds, "sekunder");
	return seconds;
}

export async function communicatorEducator(driver) {
	const start = Date.now();

	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication");

	await performLogin(driver, "A9-106816@area9.dk", "Communicator Educator");
	await waitForCommunicatorUI(driver);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Educator tog:", seconds, "sekunder");
	return seconds;
}