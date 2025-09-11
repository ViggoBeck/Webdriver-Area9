import { Builder } from "selenium-webdriver";
import { loginLearner } from "./workflows/loginLearner.js";
import { loginEducator } from "./workflows/loginEducator.js";
// import { loginCurator } from "./workflows/loginCurator.js";
// import { communicatorLearner } from "./workflows/communicator.js";
import { logResult } from "./utils/log.js";

async function runAllTests() {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    const learnerTime = await loginLearner(driver);
    logResult("Login Learner", learnerTime);

    const educatorTime = await loginEducator(driver);
    logResult("Login Educator", educatorTime);

    // const curatorTime = await loginCurator(driver);
    // logResult("Login Curator", curatorTime);

    // const communicatorTime = await communicatorLearner(driver);
    // logResult("Communicator Learner", communicatorTime);

  } catch (err) {
    console.error("❌ Fejl under tests:", err);
  } finally {
    await driver.quit();
  }
}

runAllTests();