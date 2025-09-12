import { By } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";

async function debugPageLoad() {
	const driver = await createDriver();

	try {
		console.log("🔍 Basic Page Load Diagnostic");
		console.log("="  .repeat(50));

		// Test learner page
		console.log("\n📝 Loading learner page...");
		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

		// Wait and check various loading states
		for (let i = 1; i <= 10; i++) {
			console.log(`\n⏳ After ${i} second(s):`);

			// Basic page info
			const url = await driver.getCurrentUrl();
			const title = await driver.getTitle();
			const readyState = await driver.executeScript("return document.readyState");

			console.log(`   URL: ${url}`);
			console.log(`   Title: "${title}"`);
			console.log(`   Ready State: ${readyState}`);

			// Count all elements
			const allElements = await driver.findElements(By.css("*"));
			console.log(`   Total DOM elements: ${allElements.length}`);

			// Check for login elements with various selectors
			const emailInputs = await driver.findElements(By.css('input[type="email"]'));
			const usernameInputs = await driver.findElements(By.css('input[name="username"]'));
			const passwordInputs = await driver.findElements(By.css('input[type="password"]'));
			const allInputs = await driver.findElements(By.css('input'));
			const allButtons = await driver.findElements(By.css('button'));
			const submitButtons = await driver.findElements(By.css('button[type="submit"]'));

			console.log(`   Email inputs: ${emailInputs.length}`);
			console.log(`   Username inputs: ${usernameInputs.length}`);
			console.log(`   Password inputs: ${passwordInputs.length}`);
			console.log(`   All inputs: ${allInputs.length}`);
			console.log(`   All buttons: ${allButtons.length}`);
			console.log(`   Submit buttons: ${submitButtons.length}`);

			// If we find any inputs, show their details
			if (allInputs.length > 0) {
				console.log(`\n   📋 Input details:`);
				for (let j = 0; j < Math.min(allInputs.length, 5); j++) {
					try {
						const input = allInputs[j];
						const type = await input.getAttribute("type") || "none";
						const name = await input.getAttribute("name") || "none";
						const id = await input.getAttribute("id") || "none";
						const placeholder = await input.getAttribute("placeholder") || "none";
						console.log(`      ${j+1}. type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
					} catch (e) {
						console.log(`      ${j+1}. Error reading input`);
					}
				}
			}

			// If we find any buttons, show their details
			if (allButtons.length > 0) {
				console.log(`\n   🔘 Button details:`);
				for (let j = 0; j < Math.min(allButtons.length, 5); j++) {
					try {
						const button = allButtons[j];
						const type = await button.getAttribute("type") || "none";
						const id = await button.getAttribute("id") || "none";
						const text = await button.getText() || "none";
						const className = await button.getAttribute("class") || "none";
						console.log(`      ${j+1}. type="${type}" id="${id}" class="${className}" text="${text}"`);
					} catch (e) {
						console.log(`      ${j+1}. Error reading button`);
					}
				}
			}

			// Check if we have what we need
			if (emailInputs.length > 0 && passwordInputs.length > 0 && (allButtons.length > 0 || submitButtons.length > 0)) {
				console.log(`\n   ✅ Login form appears complete at ${i} second(s)`);

				// Try to get the page source to see what's actually there
				console.log(`\n📄 Page source sample (first 500 chars):`);
				try {
					const pageSource = await driver.getPageSource();
					console.log(pageSource.substring(0, 500) + "...");
				} catch (e) {
					console.log("Could not get page source");
				}

				break;
			}

			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		// Also check if there are any error messages or redirects
		console.log(`\n🔍 Checking for error indicators:`);
		const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'error') or contains(text(), 'Error') or contains(text(), 'failed') or contains(text(), 'not found')]"));
		console.log(`Found ${errorElements.length} potential error elements`);

		if (errorElements.length > 0) {
			for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
				try {
					const text = await errorElements[i].getText();
					console.log(`   ${i+1}. "${text}"`);
				} catch (e) {
					console.log(`   ${i+1}. Could not read error element`);
				}
			}
		}

	} catch (error) {
		console.error("❌ Debug error:", error.message);
		console.error("Stack trace:", error.stack);
	} finally {
		await driver.quit();
	}
}

console.log("🔧 Page Load Diagnostic Tool\n");
debugPageLoad();