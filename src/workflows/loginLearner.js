// src/tests/loginLearner.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";

export async function loginLearner(driver) {
  const totalStart = Date.now();

  await driver.get(buildLearnerUrl());
  await new Promise(r => setTimeout(r, 1500));

  // --- LOGIN FORM ---
  const emailField = await driver.wait(
    until.elementLocated(By.css('input[name="username"]')),
    DEFAULT_TIMEOUT
  );
  await emailField.sendKeys(getAccountForTest("Login Learner"));

  const passwordField = await driver.findElement(By.css('input[name="password"]'));
  await passwordField.sendKeys(DEFAULT_PASSWORD);

  const signInBtn = await driver.findElement(By.id("sign_in"));

  // --- START TIMER: Right when sign in button is clicked ---
  const start = Date.now();
  await signInBtn.click();

  // Wait for successful login with the ORIGINAL working detection logic
  const learnerSuccessSelectors = [
  	By.css('button[aria-label*="Benchmark Test"]'),
  	By.xpath("//*[contains(text(), 'Dashboard')]"),
  	By.xpath("//*[contains(text(), 'Welcome')]"),
  	By.xpath("//nav | //header"),
  	By.xpath("//*[contains(@class, 'dashboard')]")
  ];

  let loginSuccess = false;
  for (const selector of learnerSuccessSelectors) {
  	try {
  		await driver.wait(until.elementLocated(selector), 3000);
  		console.log(`✅ Learner login success detected via: ${selector}`);
  		loginSuccess = true;
  		break;
  	} catch (e) {
  		// Try next selector
  	}
  }

  if (!loginSuccess) {
  	// Fallback: check if login form disappeared
  	await new Promise(resolve => setTimeout(resolve, 2000));
  	const loginForms = await driver.findElements(By.css('input[name="username"]'));
  	if (loginForms.length === 0) {
  		console.log("✅ Login form disappeared - learner login successful");
  		loginSuccess = true;
  	}
  }

  if (!loginSuccess) {
  	throw new Error("Could not verify learner login success");
  }

  // --- STOP TIMER: Login success detected ---
  const end = Date.now();
  const seconds = ((end - start) / 1000);
  console.log(`⏱ Login Learner took: ${seconds.toFixed(3)}s`);

  // Dismiss overlay before logout
  await dismissOverlay(driver);

  // Debug snapshot
  await logCurrentState(driver, "Login Learner");
  await pauseForObservation(driver, "Dashboard loaded - learner interface", 2);

  // --- LOGOUT ---
  await performLogout(driver);

  const totalSeconds = ((Date.now() - totalStart) / 1000).toFixed(2);
  console.log(`✅ Login Learner completed in ${seconds.toFixed(3)}s (measured) | ${totalSeconds}s total incl. cleanup`);

  return seconds;
}

// --- OVERLAY HANDLING ---
async function dismissOverlay(driver) {
  try {
    const gotItCandidates = await driver.findElements(
      By.xpath("//*[normalize-space(text())='GOT IT']")
    );
    for (let btn of gotItCandidates) {
      if (await btn.isDisplayed()) {
        console.log("✅ Found GOT IT overlay, dismissing...");
        await driver.executeScript("arguments[0].click();", btn);
        await driver.wait(until.stalenessOf(btn), 10000);
        console.log("✅ Overlay dismissed");
        break;
      }
    }
  } catch {
    console.log("ℹ️ No overlay detected");
  }
}

// --- LOGOUT HANDLING ---
async function performLogout(driver) {
  console.log("🔄 Starting logout...");

  // Retry clicking menu button
  let menuBtn = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      menuBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
        5000
      );
      await driver.wait(until.elementIsVisible(menuBtn), 2000);
      await driver.executeScript("arguments[0].click();", menuBtn);
      console.log("✅ Menu opened");
      break;
    } catch (e) {
      console.log(`⚠️ Menu open failed (attempt ${attempt}): ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (!menuBtn) throw new Error("❌ Could not open menu for logout");

  // Retry clicking logout button
  let logoutBtn = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logoutBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[@aria-label='LOGOUT']")),
        5000
      );
      await driver.wait(until.elementIsVisible(logoutBtn), 2000);
      await driver.executeScript("arguments[0].click();", logoutBtn);
      console.log("✅ Logout clicked");
      break;
    } catch (e) {
      console.log(`⚠️ Logout click failed (attempt ${attempt}): ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (!logoutBtn) throw new Error("❌ Could not click logout button");

  // Verify logout success
  try {
    await driver.wait(until.elementLocated(By.css('input[name="username"]')), 8000);
    console.log("✅ Logout successful (login form visible)");
  } catch {
    const url = await driver.getCurrentUrl();
    if (url.includes("login") || url.includes("signin")) {
      console.log("✅ Logout successful (redirected to login page)");
    } else {
      console.log("⚠️ Logout may have completed but not verified");
    }
  }
}