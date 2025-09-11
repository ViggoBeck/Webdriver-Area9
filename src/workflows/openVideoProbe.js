import { By, until } from "selenium-webdriver";

export async function openVideoProbe(driver) {
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

	// Wait for dashboard to load
	await driver.wait(
		until.elementLocated(By.css('button[aria-label*="Benchmark Test"]')),
		20000
	);

	// Start timing when clicking on Video class
	const start = Date.now();

	// Look for and click Video class on dashboard
	const videoClass = await driver.wait(
		until.elementLocated(By.xpath("//*[contains(text(), 'Video') or contains(@aria-label, 'Video')]")),
		20000
	);
	await videoClass.click();

	// Wait for video content to be visible (video player or video container)
	await driver.wait(
		until.elementLocated(By.xpath("//video | //*[contains(@class, 'video')] | //*[contains(text(), 'Video')]")),
		20000
	);

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Open Video Probe tog:", seconds, "sekunder");
	return seconds;
}