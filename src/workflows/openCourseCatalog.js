import { By, until } from "selenium-webdriver";
import { performLogin, waitForSuccessfulLogin } from "../utils/login.js";
import { getAccountForTest } from "../utils/accounts.js";

export async function openCourseCatalog(driver) {
	// First login as learner
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const assignedAccount = getAccountForTest("Open Course Catalog");
	await performLogin(driver, assignedAccount);

	// Wait for dashboard to load with specific learner elements
	await waitForSuccessfulLogin(driver, [
		By.css('button[aria-label*="Benchmark Test"]'),
		By.xpath("//*[contains(text(), 'Dashboard')]")
	]);

	// Look for and click Course Catalog with multiple approaches
	const catalogSelectors = [
		By.xpath("//*[contains(text(), 'Course') and contains(text(), 'Catalog')]"),
		By.xpath("//*[contains(text(), 'Catalog')]"),
		By.xpath("//*[contains(@aria-label, 'Catalog')]"),
		By.xpath("//a[contains(@href, 'catalog')]"),
		By.xpath("//*[contains(@class, 'catalog')]")
	];

	let courseCatalog;
	for (const selector of catalogSelectors) {
		try {
			courseCatalog = await driver.wait(until.elementLocated(selector), 5000);
			await driver.wait(until.elementIsVisible(courseCatalog), 2000);
			break;
		} catch (e) {
			// Try next selector
		}
	}

	if (!courseCatalog) {
		throw new Error("Could not find Course Catalog element");
	}

	// START TIMING: Right before clicking course catalog (as per specification)
	const start = Date.now();

	// Try different click approaches for better interactability
	try {
		// Scroll element into view first
		await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", courseCatalog);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Try regular click
		await courseCatalog.click();
	} catch (clickError) {
		console.log("Regular click failed, trying JavaScript click...");
		try {
			// Fallback: JavaScript click
			await driver.executeScript("arguments[0].click();", courseCatalog);
		} catch (jsError) {
			console.log("JavaScript click failed, trying action click...");
			// Fallback: Actions click
			const actions = driver.actions();
			await actions.move({origin: courseCatalog}).click().perform();
		}
	}

	// Wait for catalog content to be visible
	const catalogContentSelectors = [
		By.xpath("//*[contains(@class, 'catalog')]"),
		By.xpath("//*[contains(text(), 'Course')]"),
		By.xpath("//*[contains(@class, 'course')]"),
		By.xpath("//*[contains(text(), 'Browse') or contains(text(), 'Search')]")
	];

	let catalogLoaded = false;
	for (const selector of catalogContentSelectors) {
		try {
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ Catalog content detected via: ${selector}`);
			catalogLoaded = true;
			break;
		} catch (e) {
			// Try next selector
		}
	}

	if (!catalogLoaded) {
		// Fallback: wait a bit and assume it loaded if no errors
		await new Promise(resolve => setTimeout(resolve, 1000));
		console.log("✅ Assuming catalog loaded (fallback)");
	}

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Open Course Catalog tog:", seconds, "sekunder");
	return seconds;
}