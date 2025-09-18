import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";

export async function openScorm(driver) {
	// --- LOGIN (ikke timed) ---
	console.log("🌐 Navigating to learner URL for SCORM test...");
	await driver.get(buildLearnerUrl());

	// Wait for page to fully load and stabilize
	await new Promise(resolve => setTimeout(resolve, 3000));

	// Debug: Check current state
	try {
		const currentUrl = await driver.getCurrentUrl();
		const pageTitle = await driver.getTitle();
		console.log(`📍 Current URL: ${currentUrl}`);
		console.log(`📄 Page title: ${pageTitle}`);
	} catch (e) {
		console.log("⚠️ Could not get page info");
	}

	// Look for login form with better error handling
	console.log("🔍 Looking for login form...");
	let needsLogin = false;
	try {
		const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
		console.log("✅ Login form found, proceeding with login...");
		await emailField.sendKeys(getAccountForTest("Open SCORM"));
		needsLogin = true;
	} catch (error) {
		// Enhanced error handling - check if we're already logged in
		console.log("⚠️ Login form not found, checking if already logged in...");

		const loginForms = await driver.findElements(By.css('input[name="username"]'));
		const dashboardElements = await driver.findElements(By.xpath("//*[text()='LEARN' or text()='TO-DO']"));

		console.log(`🔍 Login forms found: ${loginForms.length}`);
		console.log(`🔍 Dashboard elements found: ${dashboardElements.length}`);

		if (dashboardElements.length > 0) {
			console.log("✅ Already logged in, skipping login process...");
			// Already on dashboard, continue with SCORM card clicking
		} else {
			// Force navigation back to login
			console.log("🔄 Forcing fresh navigation to login page...");
			await driver.get(buildLearnerUrl());
			await new Promise(resolve => setTimeout(resolve, 4000));

			const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
			await emailField.sendKeys(getAccountForTest("Open SCORM"));

			// Complete login process
			const passwordField = await driver.findElement(By.css('input[name="password"]'));
			await passwordField.sendKeys(DEFAULT_PASSWORD);

			const signInBtn = await driver.findElement(By.id("sign_in"));
			await signInBtn.click();

			await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

			// Wait for dashboard
			await driver.wait(
				until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
				DEFAULT_TIMEOUT
			);
			console.log("✅ Login completed, dashboard loaded");
		}
	}

	// Complete login if we found the login form initially
	if (needsLogin) {
		console.log("🔐 Completing login process...");
		const passwordField = await driver.findElement(By.css('input[name="password"]'));
		await passwordField.sendKeys(DEFAULT_PASSWORD);

		const signInBtn = await driver.findElement(By.id("sign_in"));
		await signInBtn.click();

		await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

		// Wait for dashboard
		await driver.wait(
			until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
			DEFAULT_TIMEOUT
		);
		console.log("✅ Login completed, dashboard loaded");
	}

	// Ensure we're on dashboard (whether we just logged in or were already logged in)
	console.log("🔍 Verifying dashboard is loaded...");
	try {
		await driver.wait(
			until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
			DEFAULT_TIMEOUT
		);
		console.log("✅ Dashboard confirmed loaded");
	} catch (e) {
		console.log("⚠️ Dashboard verification failed, but continuing...");
	}

  // --- DISMISS OVERLAY USING SHARED FUNCTION ---
  await dismissLearnerOverlay(driver);

  // --- SCORM CARD ---
  const scormCardXPath = `
    //p[normalize-space()='1 Scorm Benchmark Test']
    /ancestor::div[contains(@class,'nativeWidget')]
    //button[@aria-label='1 Scorm' and not(@disabled)]
  `;

  let scormBtn;
  for (let attempt = 1; attempt <= 3; attempt++) {
  	try {
  		scormBtn = await driver.wait(until.elementLocated(By.xpath(scormCardXPath)), DEFAULT_TIMEOUT);
  		await driver.wait(until.elementIsVisible(scormBtn), 5000);
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", scormBtn);

      try {
        await scormBtn.click();
      } catch {
        await driver.executeScript("arguments[0].click();", scormBtn);
      }
      break;
    } catch {
      if (attempt === 3) throw new Error("Could not click SCORM card");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // --- TIMER STARTER EFTER KLIK ---
  const start = Date.now();

  // --- VENT PÅ SCORM PLAYER ---
  let scormLoaded = false;
  try {
  	await driver.wait(until.elementLocated(By.css("iframe, embed, object")), DEFAULT_TIMEOUT);
  	scormLoaded = true;
  } catch {}

  if (!scormLoaded) {
    const url = await driver.getCurrentUrl();
    if (url.includes("card=")) scormLoaded = true;
  }

  if (!scormLoaded) throw new Error("SCORM did not load in time");

  // --- STOP TIMER ---
  const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
  console.log(`⏱ SCORM load took: ${seconds}s`);

  await logCurrentState(driver, "Open SCORM");
  await pauseForObservation(driver, "SCORM content loading", 3);

  // Perform logout after test completion
  await performLearnerLogout(driver);

  return seconds;
}