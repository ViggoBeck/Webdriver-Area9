import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function openScorm(driver) {
	// --- LOGIN (ikke timed) ---
	await driver.get(buildLearnerUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
  await emailField.sendKeys(getAccountForTest("Open SCORM"));

  const passwordField = await driver.findElement(By.css('input[name="password"]'));
  await passwordField.sendKeys(DEFAULT_PASSWORD);

  const signInBtn = await driver.findElement(By.id("sign_in"));
  await signInBtn.click();

  await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

  // --- DASHBOARD ---
  await driver.wait(
  	until.elementLocated(By.xpath("//*[text()='LEARN' or text()='TO-DO']")),
  	DEFAULT_TIMEOUT
  );

  // --- ONBOARDING OVERLAY ---
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
  const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
  console.log(`⏱ SCORM load took: ${seconds}s`);

  await logCurrentState(driver, "Open SCORM");
  await pauseForObservation(driver, "SCORM content loading", 3);

  return seconds;
}