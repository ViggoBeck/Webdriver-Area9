import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";

export async function loginEducator(driver) {
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Wait for page to fully load (form elements appear after 3+ seconds)
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Use the CORRECT selectors from diagnostic
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Login Educator");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Use the SPECIFIC login button ID
	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

  // Flexible dashboard detection
  const successSelectors = [
  	By.xpath("//*[text()='Dashboard']"),
  	By.xpath("//*[contains(text(), 'Dashboard')]"),
  	By.xpath("//*[contains(text(), 'Welcome')]"),
  	By.xpath("//nav | //header"),
  	By.xpath("//*[contains(@class, 'dashboard')]")
  ];

  let loginSuccess = false;
  for (const selector of successSelectors) {
  	try {
  		await driver.wait(until.elementLocated(selector), 3000);
  		console.log(`✅ Educator login success detected via: ${selector}`);
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
  		console.log("✅ Login form disappeared - educator login successful");
  		loginSuccess = true;
  	}
  }

  if (!loginSuccess) {
  	throw new Error("Could not verify educator login success");
  }

  const end = Date.now();
  const seconds = (end - start) / 1000;
  console.log("⏱ Login Educator tog:", seconds, "sekunder");
  return seconds;
}