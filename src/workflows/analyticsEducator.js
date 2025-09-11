import { By, until } from "selenium-webdriver";

export async function analyticsEducator(driver) {
	// First login as educator
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys("A9-106816@area9.dk");

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

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.xpath("//*[text()='Dashboard']")),
		20000
	);

	// Navigate to analytics page
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=analytics");

	// Scroll down to activity log
	await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");

	// Start timing when clicking learner filter
	const start = Date.now();

	// Click learner filter and select all learners
	const learnerFilter = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Learner') or contains(@class, 'learner') or contains(text(), 'Student')]")),
		20000
	);
	await learnerFilter.click();

	// Select all learners option
	const selectAll = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'All') or contains(text(), 'Select')]")),
		10000
	);
	await selectAll.click();

	// Apply filter
	const applyButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Apply') or contains(@type, 'submit')]")),
		10000
	);
	await applyButton.click();

	// Wait until analytics data is loaded
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'analytics') or contains(@class, 'data') or contains(@class, 'loaded')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Analytics Educator tog:", seconds, "sekunder");
	return seconds;
}