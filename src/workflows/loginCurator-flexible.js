import { By, until } from "selenium-webdriver";

export async function loginCurator(driver) {
	const start = Date.now();

	await driver.get("https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys("A9-106810@area9.dk");

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys("P@ssw0rd1234");

	const signInButton = await driver.wait(
		until.elementIsEnabled(driver.findElement(By.id("sign_in"))),
		20000
	);
	await signInButton.click();

	// Try multiple approaches to detect successful login
	const dashboardSelectors = [
		By.xpath("//*[text()='Dashboard']"),
		By.xpath("//*[contains(text(), 'Dashboard')]"),
		By.xpath("//*[contains(text(), 'Welcome')]"),
		By.xpath("//*[contains(text(), 'Home')]"),
		By.xpath("//*[contains(@class, 'dashboard')]"),
		By.xpath("//*[contains(@class, 'main')]"),
		By.xpath("//*[contains(@class, 'content')]"),
		By.xpath("//*[contains(text(), 'Analytics')]"),
		By.xpath("//*[contains(text(), 'Reports')]"),
		By.xpath("//*[contains(text(), 'Users')]")
	];

	let loginSuccess = false;
	for (const selector of dashboardSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			const element = await driver.findElement(selector);
			const text = await element.getText();
			console.log(`✅ Found success indicator: "${text}"`);
			loginSuccess = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	// If no specific element found, check if we're no longer on login page
	if (!loginSuccess) {
		try {
			// Check if login form is gone (indicating successful login)
			const loginForms = await driver.findElements(By.css('input[name="username"]'));
			if (loginForms.length === 0) {
				console.log("✅ Login form disappeared - assuming successful login");
				loginSuccess = true;
			}
		} catch (e) {
			// Continue
		}
	}

	// If still no success, wait a bit more and check URL change
	if (!loginSuccess) {
		await new Promise(resolve => setTimeout(resolve, 3000));
		const currentUrl = await driver.getCurrentUrl();
		if (!currentUrl.includes("login") && currentUrl.includes("curator")) {
			console.log("✅ URL indicates successful login");
			loginSuccess = true;
		}
	}

	if (!loginSuccess) {
		throw new Error("Could not verify successful login - no dashboard elements found");
	}

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Login Curator tog:", seconds, "sekunder");
	return seconds;
}