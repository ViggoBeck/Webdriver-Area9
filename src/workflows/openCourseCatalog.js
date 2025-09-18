import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";

export async function openCourseCatalog(driver) {
  // --- LOGIN (ikke timed) ---
  await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

  const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), 20000);
  await emailField.sendKeys(getAccountForTest("Open Course Catalog"));

  const passwordField = await driver.findElement(By.css('input[name="password"]'));
  await passwordField.sendKeys(DEFAULT_PASSWORD);

  const signInBtn = await driver.findElement(By.id("sign_in"));
  await signInBtn.click();
  await driver.wait(until.stalenessOf(signInBtn), 15000).catch(() => {});

  // --- DASHBOARD ---
  await driver.wait(until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")), 30000);
  console.log("✅ Dashboard loaded successfully");

  // --- INITIAL OVERLAY DISMISSAL ---
  await dismissLearnerOverlay(driver, "(after login)");

  // Additional pause to let any animations settle
  await new Promise(resolve => setTimeout(resolve, 1000));

  // --- OPEN MENU WITH ROBUST RETRY LOGIC ---
  console.log("🍔 Opening menu for Course Catalog access...");
  let menuBtn = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
  	try {
  		// Dismiss any overlays that might interfere (only on retry attempts)
  		if (attempt > 1) {
  			await dismissLearnerOverlay(driver, "(before menu retry)");
  		}

  		menuBtn = await driver.wait(
  			until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
  			10000
  		);
  		await driver.wait(until.elementIsVisible(menuBtn), 2000);

  		// Use JavaScript click for reliability
  		await driver.executeScript("arguments[0].click();", menuBtn);
  		console.log(`✅ Menu opened successfully`);
  		break;
  	} catch (e) {
  		console.log(`⚠️ Menu open failed (attempt ${attempt}): ${e.message}`);
  		if (attempt < 3) {
  			await new Promise(r => setTimeout(r, 1000));
  		}
  	}
  }

  if (!menuBtn) {
  	throw new Error("❌ Could not open menu for Course Catalog access");
  }

  // Wait for menu to fully appear
  await new Promise(resolve => setTimeout(resolve, 1000));

  // --- FIND AND CLICK COURSE CATALOG WITH ROBUST RETRY ---
  console.log("📚 Looking for Course Catalog button...");
  let catalogBtn = null;
  const start = Date.now(); // Start timing here

  for (let attempt = 1; attempt <= 3; attempt++) {
  	try {
  		// Dismiss any overlays that might have appeared when menu opened (only on retries)
  		if (attempt > 1) {
  			await dismissLearnerOverlay(driver, "(before catalog retry)");
  		}

  		catalogBtn = await driver.wait(
  			until.elementLocated(By.xpath("//button[@aria-label='COURSE CATALOG']")),
  			10000
  		);
  		await driver.wait(until.elementIsVisible(catalogBtn), 5000);

  		// Scroll into view
  		await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", catalogBtn);
  		await new Promise(r => setTimeout(r, 1000));

  		// Try JavaScript click directly (most reliable)
  		await driver.executeScript("arguments[0].click();", catalogBtn);
  		console.log(`✅ Course Catalog clicked successfully`);
  		break;

  	} catch (e) {
  		console.log(`⚠️ Course Catalog click failed (attempt ${attempt}): ${e.message}`);
  		if (attempt < 3) {
  			await new Promise(r => setTimeout(r, 1000));
  		}
  	}
  }

  if (!catalogBtn) {
  	throw new Error("❌ Could not click Course Catalog button after 3 attempts");
  }

  // --- VERIFY CATALOG CONTENT LOADED ---
  console.log("📚 Verifying Course Catalog content loaded...");
  let loaded = false;

  try {
  	await driver.wait(
  		until.elementLocated(By.xpath("//*[contains(text(),'Catalog') or contains(text(),'Course')]")),
  		10000
  	);
  	console.log("✅ Catalog content detected via text");
  	loaded = true;
  } catch {
  	// Fallback: check URL
  	try {
  		const url = await driver.getCurrentUrl();
  		console.log(`🔍 Current URL: ${url}`);
  		if (url.includes("catalog")) {
  			console.log("✅ Catalog detected via URL");
  			loaded = true;
  		}
  	} catch (e) {
  		console.log("⚠️ Could not verify catalog load");
  	}
  }

  if (!loaded) {
  	// Final attempt - check for any catalog-related elements
  	try {
  		const catalogElements = await driver.findElements(By.xpath("//*[contains(@class,'catalog') or contains(@class,'course')]"));
  		if (catalogElements.length > 0) {
  			console.log("✅ Catalog detected via CSS classes");
  			loaded = true;
  		}
  	} catch (e) {
  		console.log("⚠️ Final catalog verification failed");
  	}
  }

  if (!loaded) {
  	throw new Error("❌ Course Catalog did not load in time - no content detected");
  }

  // --- STOP TIMER ---
  const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
  console.log(`⏱ Course Catalog load took: ${seconds}s`);

  await logCurrentState(driver, "Open Course Catalog");
  await pauseForObservation(driver, "Course Catalog content loading", 2);

  // Perform logout after test completion
  await performLearnerLogout(driver);

  return seconds;
}