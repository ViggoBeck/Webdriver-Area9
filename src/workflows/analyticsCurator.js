import { By, until } from "selenium-webdriver";

export async function analyticsCuratorUniqueUsers(driver) {
	// First login as curator
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

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.xpath("//*[text()='Dashboard']")),
		20000
	);

	// Click on analytics
	const analyticsLink = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Analytics') or contains(@href, 'analytics')]")),
		20000
	);
	await analyticsLink.click();

	// Start timing when clicking on report
	const start = Date.now();

	// Click on report dropdown/menu
	const reportButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Report') or contains(@class, 'report')]")),
		20000
	);
	await reportButton.click();

	// Choose Unique users
	const uniqueUsersOption = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Unique') and contains(text(), 'Users')]")),
		10000
	);
	await uniqueUsersOption.click();

	// Wait until report is loaded
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'report-data') or contains(@class, 'loaded') or contains(text(), 'Unique')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Analytics Curator Unique Users tog:", seconds, "sekunder");
	return seconds;
}

export async function analyticsCuratorProjectTeam(driver) {
	// First login as curator
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

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.xpath("//*[text()='Dashboard']")),
		20000
	);

	// Click on analytics
	const analyticsLink = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Analytics') or contains(@href, 'analytics')]")),
		20000
	);
	await analyticsLink.click();

	// Click on report dropdown/menu
	const reportButton = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Report') or contains(@class, 'report')]")),
		20000
	);
	await reportButton.click();

	// Choose Project Team activity
	const projectTeamOption = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Project') and contains(text(), 'Team')]")),
		10000
	);
	await projectTeamOption.click();

	// Start timing when choosing project team
	const start = Date.now();

	// Choose project team: Benchmark Test BR
	const projectTeamSelect = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Benchmark Test BR') or contains(@value, 'Benchmark Test BR')]")),
		20000
	);
	await projectTeamSelect.click();

	// Wait until report is loaded
	await driver.wait(
		until.elementLocated(By.xpath("//*[contains(@class, 'report-data') or contains(@class, 'loaded') or contains(text(), 'Project')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Analytics Curator Project Team tog:", seconds, "sekunder");
	return seconds;
}