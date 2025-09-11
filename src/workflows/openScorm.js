import { By, until } from "selenium-webdriver";

export async function openScorm(driver) {
	// First login as learner
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys("A9-106821@area9.dk");

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

	// Wait for dashboard to load with SCORM class
	await driver.wait(
		until.elementLocated(By.css('button[aria-label*="Benchmark Test"]')),
		20000
	);

	// Start timing when clicking on SCORM class
	const start = Date.now();

	// Look for and click SCORM class on dashboard
	const scormClass = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'SCORM') or contains(@aria-label, 'SCORM')]")),
		20000
	);
	await scormClass.click();

	// Wait for SCORM content to be visible
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'scorm') or contains(text(), 'SCORM')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Open SCORM tog:", seconds, "sekunder");
	return seconds;
}