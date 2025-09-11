import { By, until } from "selenium-webdriver";

export async function createClass(driver) {
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

	// Start timing when starting class creation
	const start = Date.now();

	// Look for Create Class button or Add Class button
	const createButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Create') and contains(text(), 'Class')] | //*[contains(text(), 'Add') and contains(text(), 'Class')] | //*[contains(@class, 'create')] | //*[text()='+']")),
		20000
	);
	await createButton.click();

	// Fill in class details (basic form)
	const classNameField = await driver.wait(
		until.elementLocated(By.xpath("//input[@placeholder='Class name'] | //input[@name='name'] | //input[contains(@class, 'name')]")),
		10000
	);
	await classNameField.sendKeys("Test Class " + Date.now());

	// Submit the form
	const submitButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Create')] | //*[contains(text(), 'Save')] | //*[@type='submit']")),
		10000
	);
	await submitButton.click();

	// Wait until class is created (success message or redirect)
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Success') or contains(text(), 'Created') or contains(@class, 'success')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Create Class tog:", seconds, "sekunder");
	return seconds;
}