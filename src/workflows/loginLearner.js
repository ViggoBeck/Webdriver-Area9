import { By, until } from "selenium-webdriver";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";

export async function loginLearner(driver) {
	await driver.get(
		"https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc"
	);

	// Wait for page to fully load (form elements appear after 3+ seconds)
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Use the CORRECT selectors from diagnostic
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Login Learner");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Use the SPECIFIC login button ID (not generic submit button)
	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);

	// START TIMING: Right before clicking login (as per specification)
	const start = Date.now();
	await signInButton.click();

  // Wait for successful login with flexible detection
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

  // Pause to let user observe the dashboard in visual mode
  await logCurrentState(driver, "Login Learner");
  await pauseForObservation(driver, "Dashboard loaded - you can see the learner interface", 3);

  const end = Date.now();
  const seconds = (end - start) / 1000;

  console.log("⏱ Login Learner tog:", seconds, "sekunder");
  return seconds;
}