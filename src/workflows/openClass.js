import { By, until } from "selenium-webdriver";

export async function openClass(driver) {
	// First login as educator
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys("a9-106817@area9.dk");

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

	// Start timing when clicking on a class
	const start = Date.now();

	// Look for "Benchmark Test 1 Do not touch" class
	const benchmarkClass = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Benchmark Test 1') or contains(text(), 'Do not touch')]")),
		20000
	);
	await benchmarkClass.click();

	// Wait until class is opened (look for class content)
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'class') or contains(text(), 'Class') or contains(text(), 'Students')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Open Class tog:", seconds, "sekunder");
	return seconds;
}