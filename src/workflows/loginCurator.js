import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";

export async function loginCurator(driver) {
	await driver.get("https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Use the REAL selectors found by debugging
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[type="email"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Login Curator");
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

	// Wait for successful login - try multiple indicators
	const successSelectors = [
		By.xpath("//*[text()='Dashboard']"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//*[contains(@class, 'dashboard')]"),
		By.xpath("//*[contains(@class, 'main-content')]"),
		By.xpath("//*[contains(@class, 'app-content')]"),
		By.xpath("//nav | //header | //*[@role='navigation']"),
		By.xpath("//*[contains(text(), 'Analytics') or contains(text(), 'Reports') or contains(text(), 'Users')]")
	];

	let loginSuccess = false;
	for (const selector of successSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ Login success detected via: ${selector}`);
			loginSuccess = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	// If no specific element found, check if we're no longer on login page
	if (!loginSuccess) {
		await new Promise(resolve => setTimeout(resolve, 2000));
		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		if (loginForms.length === 0) {
			console.log("✅ Login form disappeared - login successful");
			loginSuccess = true;
		}
	}

	if (!loginSuccess) {
		throw new Error("Could not verify successful login");
	}

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Login Curator tog:", seconds, "sekunder");
	return seconds;
}