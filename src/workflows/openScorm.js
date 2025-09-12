import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function openScorm(driver) {
	// --- LOGIN ---
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
	await new Promise(r => setTimeout(r, 4000));

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), 20000);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Open SCORM");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(until.elementLocated(By.css('input[name="password"]')), 20000);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(until.elementLocated(By.id("sign_in")), 20000);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);
	await signInButton.click();

	await driver.wait(until.stalenessOf(signInButton), 15000).catch(() => {
		console.log("⚠️ Login button didn’t disappear but continuing...");
	});

	console.log("⏳ Waiting for dashboard...");
	await driver.wait(async () => {
		const loginButtons = await driver.findElements(By.id("sign_in"));
		return loginButtons.length === 0;
	}, 20000, "Never left login page");

	await new Promise(r => setTimeout(r, 3000));

	// --- SCORM SELECTOR ---
	// Step 1: Find the disabled button by aria-label
	const disabledBtn = await driver.findElement(By.xpath("//button[@aria-label='1 Scorm Benchmark Test']"));

	// Step 2: Climb to clickable ancestor (div with pointer-events/role=button)
	const clickableAncestor = await driver.findElement(
		By.xpath("//button[@aria-label='1 Scorm Benchmark Test']/ancestor::*[contains(@style,'pointer-events') or @role='button'][1]")
	);

	// --- CLICK ---
	let clickSuccess = false;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			console.log(`🖱️ Attempt ${attempt}: clicking SCORM ancestor...`);
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", clickableAncestor);
			await new Promise(r => setTimeout(r, 1000));

			try {
				await clickableAncestor.click();
				console.log("✅ Regular click on ancestor worked");
			} catch {
				console.log("ℹ️ Regular click failed → using JS click");
				await driver.executeScript("arguments[0].click();", clickableAncestor);
			}

			clickSuccess = true;
			break;
		} catch (err) {
			console.log(`❌ Attempt ${attempt} failed: ${err.message}`);
			if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
		}
	}

	if (!clickSuccess) {
		throw new Error("Failed to click SCORM ancestor after retries");
	}

	// --- WAIT FOR SCORM TO LOAD ---
	let scormLoaded = false;

	try {
		await driver.wait(until.elementLocated(By.css("iframe, embed, object")), 10000);
		console.log("✅ SCORM player/iframe detected");
		scormLoaded = true;
	} catch {
		console.log("ℹ️ No iframe yet, checking URL/text...");
	}

	if (!scormLoaded) {
		const url = await driver.getCurrentUrl();
		if (url.includes("scorm")) {
			console.log("✅ URL contains 'scorm' → SCORM likely opened");
			scormLoaded = true;
		}
	}

	if (!scormLoaded) {
		try {
			await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'SCORM') or contains(text(),'Player')]")), 5000);
			console.log("✅ SCORM content detected by text");
			scormLoaded = true;
		} catch {
			console.log("ℹ️ Still no SCORM content detected");
		}
	}

	if (!scormLoaded) {
		console.log("⏳ Waiting 3s grace period for SCORM to load...");
		await new Promise(r => setTimeout(r, 3000));
	}

	// --- DEBUG / OBSERVE ---
	await logCurrentState(driver, "Open SCORM");
	await pauseForObservation(driver, "SCORM content loading - observe interface", 3);

	console.log("⏱ Finished openScorm()");
	return true;
}