import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl } from "../utils/config.js";
import { waitForSuccessfulLogin } from "../utils/login.js";

export async function openCourseCatalog(driver) {
	// Go to learner base URL and log in
	await driver.get(buildLearnerUrl());

	// Login (inline for parity with existing flows)
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	await emailField.sendKeys(getAccountForTest("Open Course Catalog"));

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);
	await signInButton.click();

	await waitForSuccessfulLogin(driver);

	// Try to locate the Course Catalog entry/menu/button
	const catalogSelectors = [
		By.xpath("//*[normalize-space(text())='Course catalog']"),
		By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'course catalog')]") ,
		By.css('button[aria-label*="catalog"]'),
		By.css('a[href*="catalog"]'),
	];

	let catalogEntry = null;
	for (const sel of catalogSelectors) {
		try {
			const el = await driver.wait(until.elementLocated(sel), 5000);
			await driver.wait(until.elementIsVisible(el), 3000);
			catalogEntry = el; break;
		} catch (_) {}
	}
	if (!catalogEntry) throw new Error("Could not find 'Course catalog' entry");

	// START TIMING: when clicking Course Catalog
	const start = Date.now();
	await catalogEntry.click();

	// Consider catalog loaded when any of these are present/active
	const loadedSelectors = [
		By.xpath("//*[contains(@class,'catalog')]") ,
		By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'all courses')]") ,
		By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'course catalog')]") ,
		By.css('[role="tabpanel"][aria-label*="catalog"]'),
	];

	let loaded = false;
	for (const sel of loadedSelectors) {
		try {
			await driver.wait(until.elementLocated(sel), 5000);
			loaded = true; break;
		} catch (_) {}
	}
	if (!loaded) {
		// fallback small wait
		await new Promise(r => setTimeout(r, 1000));
	}

	const seconds = (Date.now() - start) / 1000;
	console.log("⏱ Open Course Catalog took:", seconds, "seconds");
	return seconds;
}
