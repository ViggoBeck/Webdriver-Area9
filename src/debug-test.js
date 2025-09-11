import { By, until } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";
import { debugPageElements, waitForPageLoad } from "./utils/debug.js";

async function debugPages() {
	const driver = await createDriver();

	try {
		// Test URLs from your specifications
		const testUrls = [
			{
				name: "Learner Login",
				url: "https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc"
			},
			{
				name: "Educator Login",
				url: "https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc"
			},
			{
				name: "Curator Login",
				url: "https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc"
			},
			{
				name: "Communicator Learner",
				url: "https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication&folderIds=[Inbox]"
			}
		];

		for (const testUrl of testUrls) {
			console.log(`\n${'='.repeat(60)}`);
			console.log(`🌐 Testing: ${testUrl.name}`);
			console.log(`🔗 URL: ${testUrl.url}`);
			console.log(`${'='.repeat(60)}`);

			try {
				await driver.get(testUrl.url);
				await waitForPageLoad(driver, 10000);

				// Wait a moment for any dynamic content
				await new Promise(resolve => setTimeout(resolve, 3000));

				await debugPageElements(driver, testUrl.name);

				// Pause between tests
				await new Promise(resolve => setTimeout(resolve, 2000));

			} catch (error) {
				console.log(`❌ Error testing ${testUrl.name}: ${error.message}`);
			}
		}

		// Test a successful login to see what the dashboard looks like
		console.log(`\n${'='.repeat(60)}`);
		console.log(`🔐 Testing successful login to see dashboard structure`);
		console.log(`${'='.repeat(60)}`);

		try {
			await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
			await waitForPageLoad(driver);

			// Try the login that we know works
			console.log("🔓 Attempting login...");

			// First check if login form exists
			const loginFormExists = await driver.findElements(By.css('input[name="username"]'));
			if (loginFormExists.length > 0) {
				const emailField = await driver.findElement(By.css('input[name="username"]'));
				await emailField.sendKeys("A9-106821@area9.dk");

				const passwordField = await driver.findElement(By.css('input[name="password"]'));
				await passwordField.sendKeys("P@ssw0rd1234");

				const signInButton = await driver.findElement(By.id("sign_in"));
				await signInButton.click();

				// Wait for dashboard and then debug it
				await new Promise(resolve => setTimeout(resolve, 5000));
				await debugPageElements(driver, "Successful Login Dashboard");
			} else {
				console.log("❌ No login form found on learner page");
				await debugPageElements(driver, "Learner Page (No Login Form)");
			}

		} catch (error) {
			console.log(`❌ Error during login test: ${error.message}`);
		}

	} catch (error) {
		console.error("❌ General error:", error);
	} finally {
		await driver.quit();
	}
}

// Run the debug
console.log(`
🔧 Area9 HTML Structure Debugger
This will inspect the actual HTML elements on each page
to help identify the correct selectors.
`);

debugPages();