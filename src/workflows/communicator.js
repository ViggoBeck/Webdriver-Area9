import { By, until } from "selenium-webdriver";

export async function communicatorLearner(driver) {
	const start = Date.now();

	// Open communicator URL directly with learner credentials
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]");

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

	// Wait for communicator UI to be visible (look for common communicator elements)
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'communication') or contains(text(), 'Inbox') or contains(text(), 'Messages')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Learner tog:", seconds, "sekunder");
	return seconds;
}

export async function communicatorEducator(driver) {
	const start = Date.now();

	// Open communicator URL directly with educator credentials
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication");

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

	// Wait for communicator UI to be visible (look for common communicator elements)
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'communication') or contains(text(), 'Communication') or contains(text(), 'Messages')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Communicator Educator tog:", seconds, "sekunder");
	return seconds;
}