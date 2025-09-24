// src/workflows/deleteClass.js
import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { buildEducatorUrl, DEFAULT_TIMEOUT } from "../utils/config.js";
import { logCurrentState, pauseForObservation } from "../utils/debug-helpers.js";

// ---------- helpers ----------
async function scrollHorizontallyToRevealElements(driver) {
  try {
    await driver.executeScript(`
      const scrollAreas = document.querySelectorAll("div.nativeWidget");
      scrollAreas.forEach(el => {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft = el.scrollWidth;
        }
      });
    `);
    console.log("✅ Scrolled horizontally to reveal hidden elements");
    await new Promise(r => setTimeout(r, 500));
    return true;
  } catch (e) {
    console.log("⚠️ Could not scroll horizontally:", e.message);
    return false;
  }
}

// --- find row by NAME → STATUS ---
async function findClassRow(driver, className, status = "Inactive", timeout = DEFAULT_TIMEOUT) {
  try {
    // Wait until at least one class label appears
    await driver.wait(
      until.elementLocated(By.xpath(`//p[normalize-space(.)='${className}']`)),
      timeout
    );

    // Get all candidate rows that contain the class name
    const candidates = await driver.findElements(
      By.xpath(`//p[normalize-space(.)='${className}']/ancestor::tr
                | //p[normalize-space(.)='${className}']/ancestor::div[contains(@class,'nativeWidget')]`)
    );

    for (const row of candidates) {
      // Inside this row, check if the status exists
      const statuses = await row.findElements(By.xpath(`.//p[normalize-space(.)='${status}']`));
      if (statuses.length > 0) {
        console.log(`✅ Found row with '${className}' and status '${status}'`);
        return row;
      }
    }

    console.log(`❌ No '${className}' with status '${status}' found`);
    return null;
  } catch (e) {
    console.log(`❌ Error in findClassRow: ${e.message}`);
    return null;
  }
}

// --- delete inside that row ---
async function deleteClassWithConfirmation(driver, classRow, className) {
  try {
    // Find the delete button inside this row
    const deleteBtn = await classRow.findElement(By.xpath(".//button[@aria-label='delete']"));
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", deleteBtn);
    await driver.executeScript("arguments[0].click();", deleteBtn);
    console.log(`✅ Clicked delete icon for '${className}'`);

    // Confirm delete
    console.log("⏳ Waiting for confirm delete dialog...");
    let confirmBtn;
    try {
      confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[@aria-label='DELETE']")),
        5000
      );
    } catch {
      confirmBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[normalize-space()='DELETE']")),
        5000
      );
    }

    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", confirmBtn);
    await driver.executeScript("arguments[0].click();", confirmBtn);
    console.log("✅ Confirm delete clicked");

    // Verify the row is gone
    await driver.wait(until.stalenessOf(classRow), 8000);
    console.log(`✅ '${className}' class successfully deleted`);
    return true;
  } catch (e) {
    console.log(`❌ Failed to delete '${className}' class: ${e.message}`);
    return false;
  }
}

// --- main workflow ---
export async function deleteClass(driver) {
  console.log("🚀 Starting Delete Class test...");
  const start = Date.now();

  // LOGIN AS EDUCATOR
  await driver.get(buildEducatorUrl());

  const emailField = await driver.wait(
    until.elementLocated(By.css('input[name="username"]')),
    DEFAULT_TIMEOUT
  );
  await emailField.sendKeys(getAccountForTest("Delete Class"));

  const passwordField = await driver.findElement(By.css('input[name="password"]'));
  await passwordField.sendKeys(DEFAULT_PASSWORD);

  const signInBtn = await driver.findElement(By.id("sign_in"));
  await signInBtn.click();
  await driver.wait(until.stalenessOf(signInBtn), DEFAULT_TIMEOUT).catch(() => {});

  // DASHBOARD
  await driver.wait(
    until.elementLocated(By.xpath("//*[contains(text(),'CLASSES') or contains(text(),'Dashboard')]")),
    DEFAULT_TIMEOUT
  );
  console.log("✅ Logged in as Educator");

  // DISMISS OVERLAY
  try {
    const gotItCandidates = await driver.findElements(By.xpath("//*[normalize-space(text())='GOT IT']"));
    for (const btn of gotItCandidates) {
      if (await btn.isDisplayed()) {
        await driver.executeScript("arguments[0].click();", btn);
        await driver.wait(until.stalenessOf(btn), 10000).catch(() => {});
        break;
      }
    }
  } catch {}

  // SCROLL
  await scrollHorizontallyToRevealElements(driver);

  // FIND ROW
  const classRow = await findClassRow(driver, "Webdriver", "Inactive");
  if (!classRow) throw new Error("❌ No inactive 'Webdriver' class found");

  // DELETE
  const success = await deleteClassWithConfirmation(driver, classRow, "Webdriver");
  if (!success) throw new Error("❌ Failed to delete 'Webdriver' class");

  // STOP TIMER
  const seconds = Number(((Date.now() - start) / 1000).toFixed(2));
  console.log(`⏱ Delete Class took: ${seconds}s`);

  await logCurrentState(driver, "Delete Class");
  await pauseForObservation(driver, "Class deletion complete", 3);

  console.log("✨ Delete Class test finished");
  return seconds;
}