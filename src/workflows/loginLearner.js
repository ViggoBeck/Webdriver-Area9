import { By, until } from "selenium-webdriver";

export async function loginLearner(driver) {
  const start = Date.now();

  await driver.get(
    "https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc"
  );

  const emailField = await driver.wait(
    until.elementLocated(By.css('input[name="username"]')),
    20000
  );
  await driver.wait(until.elementIsVisible(emailField), 5000);
  await emailField.sendKeys("A9-106821@area9.dk");

  const passwordField = await driver.wait(
    until.elementLocated(By.css('input[name="password"]')),
    20000
  );
  await driver.wait(until.elementIsVisible(passwordField), 5000);
  await passwordField.sendKeys("P@ssw0rd1234"); // <-- skift til korrekt

  const signInButton = await driver.wait(
    until.elementIsEnabled(driver.findElement(By.id("sign_in"))),
    20000
  );
  await signInButton.click();

  await driver.wait(
    until.elementLocated(By.css('button[aria-label*="Benchmark Test"]')),
    20000
  );

  const end = Date.now();
  const seconds = (end - start) / 1000;

  console.log("⏱ Login Learner tog:", seconds, "sekunder");
  return seconds;
}