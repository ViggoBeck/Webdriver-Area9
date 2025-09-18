import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildLearnerUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { dismissLearnerOverlay, performLearnerLogout } from "../utils/learner-utils.js";

export async function openVideoProbe(driver) {
	// --- LOGIN (ikke timed) ---
	await driver.get(buildLearnerUrl());

	const emailField = await driver.wait(until.elementLocated(By.css('input[name="username"]')), DEFAULT_TIMEOUT);
  await emailField.sendKeys(getAccountForTest("Open Video Probe"));

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

  // --- DISMISS OVERLAY USING SHARED FUNCTION ---
  await dismissLearnerOverlay(driver);

  // --- FIND VIDEO BENCHMARK CARD ---
  const videoCardXPath = `
    //p[normalize-space()='1 Video Benchmark Test']
    /ancestor::div[contains(@class,'nativeWidget')]
    //button[@aria-label='1 Video' and not(@disabled)]
  `;

  let videoBtn;
  for (let attempt = 1; attempt <= 3; attempt++) {
  	try {
  		videoBtn = await driver.wait(until.elementLocated(By.xpath(videoCardXPath)), DEFAULT_TIMEOUT);
  		await driver.wait(until.elementIsVisible(videoBtn), 5000);
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", videoBtn);

      try {
        await videoBtn.click();
      } catch {
        await driver.executeScript("arguments[0].click();", videoBtn);
      }
      break;
    } catch {
      if (attempt === 3) throw new Error("Could not click Video Benchmark Test card");
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // --- START TIMER EFTER KLIK ---
  const start = Date.now();

  // --- VENT PÅ VIDEO FILE ---
  let videoLoaded = false;
  try {
  	await driver.wait(until.elementLocated(By.css("video, iframe, embed, object")), DEFAULT_TIMEOUT);
  	videoLoaded = true;
  } catch {}

  if (!videoLoaded) {
    const url = await driver.getCurrentUrl();
    if (url.includes("card=")) videoLoaded = true;
  }

  if (!videoLoaded) throw new Error("Video probe did not load in time");

  // --- STOP TIMER ---
  const seconds = Number(((Date.now() - start) / 1000).toFixed(3));
  console.log(`⏱ Video probe load took: ${seconds}s`);

  await logCurrentState(driver, "Open Video Probe");
  await pauseForObservation(driver, "Video probe content loading", 3);

  // Perform logout after test completion
  await performLearnerLogout(driver);

  return seconds;
}