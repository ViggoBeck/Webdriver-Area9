import { By, until } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";
import { getAllAccounts, DEFAULT_PASSWORD } from "./utils/accounts.js";

async function verifyAllAccounts() {
	const driver = await createDriver();

	try {
		console.log("🔐 Verifying All Test Accounts");
		console.log("="  .repeat(50));

		const allAccounts = getAllAccounts();
		let workingAccounts = { learner: [], educator: [], curator: [] };
		let failedAccounts = [];

		// Test each role and account
		for (const [role, accounts] of Object.entries(allAccounts)) {
			console.log(`\n📋 Testing ${role.toUpperCase()} accounts:`);

			let baseUrl;
			if (role === 'learner') {
				baseUrl = "https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
			} else if (role === 'educator') {
				baseUrl = "https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
			} else if (role === 'curator') {
				baseUrl = "https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
			}

			for (let i = 0; i < accounts.length; i++) {
				const account = accounts[i];
				console.log(`\n👤 Testing: ${account}`);

				try {
					await driver.get(baseUrl);
					await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer for page load

					// Check if login form exists
					console.log("   🔍 Looking for login form...");
					const loginFormExists = await driver.findElements(By.css('input[type="email"]'));
					if (loginFormExists.length === 0) {
						console.log(`   ❌ No login form found for ${account}`);
						failedAccounts.push({ account, role, error: "No login form" });
						continue;
					}

					const emailField = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);
					await driver.wait(until.elementIsVisible(emailField), 5000);
					await emailField.clear();
					await emailField.sendKeys(account);

					const passwordField = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 10000);
					await driver.wait(until.elementIsVisible(passwordField), 5000);
					await passwordField.clear();
					await passwordField.sendKeys(DEFAULT_PASSWORD);

					const signInButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
					await driver.wait(until.elementIsEnabled(signInButton), 5000);
					await signInButton.click();

					console.log("   ⏳ Waiting for login result...");

					// Wait for login to complete (either success or failure)
					await new Promise(resolve => setTimeout(resolve, 8000));

					// Check if still on login page (login failed) or moved to dashboard (success)
					const stillOnLogin = await driver.findElements(By.css('input[type="email"]'));

					if (stillOnLogin.length === 0) {
						console.log(`   ✅ Login successful for ${account}`);
						workingAccounts[role].push(account);

						// Quick check of what's on the page after login
						const currentUrl = await driver.getCurrentUrl();
						const pageTitle = await driver.getTitle();
						console.log(`   📍 Redirected to: ${currentUrl}`);
						console.log(`   📄 Page title: ${pageTitle}`);

					} else {
						console.log(`   ❌ Login failed for ${account} (still on login page)`);
						failedAccounts.push({ account, role, error: "Login failed" });
					}

				} catch (error) {
					console.log(`   ❌ Error testing ${account}: ${error.message}`);
					failedAccounts.push({ account, role, error: error.message });
				}

				// Small delay between tests
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
		}

		// Summary
		console.log("\n" + "="  .repeat(50));
		console.log("📊 ACCOUNT VERIFICATION SUMMARY");
		console.log("="  .repeat(50));

		for (const [role, accounts] of Object.entries(workingAccounts)) {
			console.log(`\n✅ Working ${role.toUpperCase()} accounts (${accounts.length}):`);
			accounts.forEach((account, i) => {
				console.log(`   ${i+1}. ${account}`);
			});
		}

		if (failedAccounts.length > 0) {
			console.log(`\n❌ Failed accounts (${failedAccounts.length}):`);
			failedAccounts.forEach(({ account, role, error }) => {
				console.log(`   ${account} (${role}) - ${error}`);
			});
		}

		console.log(`\n📈 Success rate: ${Object.values(workingAccounts).flat().length}/${Object.values(getAllAccounts()).flat().length} accounts working`);

	} catch (error) {
		console.error("❌ General verification error:", error);
	} finally {
		await driver.quit();
	}
}

console.log("🔧 Account Verification Tool\n");
verifyAllAccounts();