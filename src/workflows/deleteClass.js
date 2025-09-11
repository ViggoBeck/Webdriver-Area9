import { By, until } from "selenium-webdriver";

export async function deleteClass(driver) {
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

	// Start timing when starting class deletion
	const start = Date.now();

	// Look for a test class to delete (or class with delete option)
	const classToDelete = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Test Class') or contains(@class, 'class-item')]")),
		20000
	);

	// Right-click or look for delete option (this might be a menu or button)
	const deleteButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Delete') or contains(@class, 'delete') or contains(@title, 'Delete')]")),
		10000
	);
	await deleteButton.click();

	// Confirm deletion if there's a confirmation dialog
	try {
		const confirmButton = await driver.wait(
			until.elementLocated(By.xpath("//*[contains(text(), 'Confirm') or contains(text(), 'Yes') or contains(text(), 'Delete')]")),
			5000
		);
		await confirmButton.click();
	} catch (e) {
		// No confirmation dialog, continue
	}

	// Wait until class is deleted (success message or class disappears)
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Deleted') or contains(text(), 'Success') or contains(@class, 'success')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Delete Class tog:", seconds, "sekunder");
	return seconds;
}