import { By, until } from "selenium-webdriver";
import { DEFAULT_PASSWORD } from "./accounts.js";

export async function performLogin(driver, email, password = DEFAULT_PASSWORD) {
	// Wait longer for page to fully load (elements appear after 3+ seconds)
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Use the CORRECT selectors from diagnostic
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')), // More specific than type
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys(email);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')), // More specific than type
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(password);

	// Use the SPECIFIC login button (not generic submit button)
	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")), // The actual login button ID
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	await signInButton.click();
}

export async function waitForSuccessfulLogin(driver, specificSelectors = []) {
	// Common success indicators
	const commonSelectors = [
		By.xpath("//*[text()='Dashboard']"),
		By.xpath("//*[contains(text(), 'Dashboard')]"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//*[contains(@class, 'dashboard')]"),
		By.xpath("//*[contains(@class, 'main-content')]"),
		By.xpath("//*[contains(@class, 'app-content')]"),
		By.xpath("//nav | //header | //*[@role='navigation']")
	];

	// Combine with any test-specific selectors
	const allSelectors = [...specificSelectors, ...commonSelectors];

	let loginSuccess = false;
	for (const selector of allSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ Login success detected via: ${selector}`);
			loginSuccess = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	// Fallback: check if login form disappeared
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

	return loginSuccess;
}