import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

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

  // --- OVERLAY (hvis den findes) ---
  try {
    const gotItCandidates = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
    for (let btn of gotItCandidates) {
      if (await btn.isDisplayed()) {
        await driver.executeScript("arguments[0].click();", btn);
        await driver.wait(until.stalenessOf(btn), 10000);
        break;
      }
    }
  } catch {}

  // --- ÅBN MENU ---
  const menuBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
    10000
  );
  await menuBtn.click();

  // --- FIND COURSE CATALOG ---
  const catalogBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[@aria-label='COURSE CATALOG']")),
    10000
  );
  await driver.wait(until.elementIsVisible(catalogBtn), 5000);

  // Scroll ind i view
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", catalogBtn);
  await new Promise(r => setTimeout(r, 500));

  // --- START TIMER EFTER SUCCESFULDT KLIK ---
  const start = Date.now();
  let clicked = false;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await catalogBtn.click();
      clicked = true;
      break;
    } catch {
      try {
        await driver.executeScript("arguments[0].click();", catalogBtn);
        clicked = true;
        break;
      } catch {
        if (attempt === 2) throw new Error("❌ Could not click Course Catalog button");
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  if (!clicked) throw new Error("❌ Could not click Course Catalog");

  // --- VENT PÅ CATALOG CONTENT ---
  let loaded = false;
  try {
    await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Catalog') or contains(text(),'Course')]")),
      5000
    );
    loaded = true;
  } catch {}

  if (!loaded) {
    const url = await driver.getCurrentUrl();
    if (url.includes("catalog")) loaded = true;
  }

  if (!loaded) throw new Error("❌ Course Catalog did not load in time");

  // --- STOP TIMER ---
  const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
  console.log(`⏱ Course Catalog load took: ${seconds}s`);

  await logCurrentState(driver, "Open Course Catalog");
  await pauseForObservation(driver, "Course Catalog content loading", 2);

  return seconds;
}