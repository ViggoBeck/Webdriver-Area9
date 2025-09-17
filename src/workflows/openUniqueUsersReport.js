import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildCuratorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function openUniqueUsersReport(driver) {
	// --- LOGIN (not timed) ---
	await driver.get(buildCuratorUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
  await emailField.sendKeys(getAccountForTest("Open Unique Users Report"));

  const passwordField = await driver.findElement(By.css('input[name="password"]'));
  await passwordField.sendKeys(DEFAULT_PASSWORD);

  const signInBtn = await driver.findElement(By.id("sign_in"));
  await signInBtn.click();
  await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

  // --- DASHBOARD ---
  await driver.wait(
  	until.elementLocated(By.xpath("//*[contains(text(),'Curator') or contains(text(),'Dashboard')]")),
  	DEFAULT_TIMEOUT
  );

  // --- OPEN MENU / ANALYTICS ---
  let analyticsBtn;
  try {
  	const menuBtn = await driver.wait(
  		until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
  		DEFAULT_TIMEOUT
  	);
  	await driver.executeScript("arguments[0].click();", menuBtn);
  	analyticsBtn = await driver.wait(
  		until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
  		DEFAULT_TIMEOUT
  	);
  } catch {
  	analyticsBtn = await driver.wait(
  		until.elementLocated(By.xpath("//button[@aria-label='Analytics']")),
  		DEFAULT_TIMEOUT
  	);
  }

  // 🔥 Always force JS click to avoid "element click intercepted"
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", analyticsBtn);
  await driver.executeScript("arguments[0].click();", analyticsBtn);

  // --- LOCATE UNIQUE USERS CARD ---
  const uniqueUsersCard = await driver.wait(
  	until.elementLocated(By.xpath("//p[normalize-space()='UNIQUE USERS']/ancestor::div[contains(@class,'nativeWidget')]")),
  	DEFAULT_TIMEOUT
  );

  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", uniqueUsersCard);
  await new Promise(r => setTimeout(r, 300));

  // --- START TIMER + CLICK ---
  const start = Date.now();
  try {
    await uniqueUsersCard.click();
  } catch {
    await driver.executeScript("arguments[0].click();", uniqueUsersCard);
  }

  // --- WAIT FOR REPORT TO LOAD ---
  let loaded = false;
  try {
  	await driver.wait(
  		until.elementLocated(By.xpath("//*[contains(text(),'Unique Users') or contains(text(),'Report')]")),
  		DEFAULT_TIMEOUT
  	);
  	loaded = true;
  } catch {}

  if (!loaded) {
    const url = await driver.getCurrentUrl();
    if (url.includes("unique") || url.includes("report")) loaded = true;
  }

  if (!loaded) throw new Error("❌ Unique Users Report did not load in time");

  // --- STOP TIMER ---
  const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
  console.log(`⏱ Unique Users Report load took: ${seconds}s`);

  await logCurrentState(driver, "Open Unique Users Report");
  await pauseForObservation(driver, "Unique Users Report content", 2);

  return seconds;
}