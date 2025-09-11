import { By } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";

async function deepDebugLogin() {
	const driver = await createDriver();

	try {
		console.log("🔍 Deep debugging login page elements...\n");

		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

		// Wait longer and check page loading
		console.log("⏳ Waiting 10 seconds for page to fully load...");
		await new Promise(resolve => setTimeout(resolve, 10000));

		// Check if page is in an iframe
		console.log("\n🖼️ Checking for iframes...");
		const iframes = await driver.findElements(By.css("iframe"));
		console.log(`Found ${iframes.length} iframe(s)`);

		if (iframes.length > 0) {
			console.log("🔄 Switching to first iframe...");
			await driver.switchTo().frame(iframes[0]);
			await new Promise(resolve => setTimeout(resolve, 3000));
		}

		// Get page title and URL
		const title = await driver.getTitle();
		const url = await driver.getCurrentUrl();
		console.log(`\n📄 Page title: "${title}"`);
		console.log(`🔗 Current URL: "${url}"`);

		// Check page ready state
		const readyState = await driver.executeScript("return document.readyState");
		console.log(`⚡ Ready state: ${readyState}`);

		// Get all clickable elements (any element that might be clickable)
		console.log("\n🖱️ Finding ALL clickable elements:");
		const clickableSelectors = [
			"button", "input", "a", "div[onclick]", "span[onclick]",
			"[role='button']", "[type='submit']", "[type='button']",
			".button", ".btn", ".submit", ".login", ".sign-in"
		];

		for (const selector of clickableSelectors) {
			try {
				const elements = await driver.findElements(By.css(selector));
				if (elements.length > 0) {
					console.log(`\n✅ Found ${elements.length} elements with selector: ${selector}`);

					for (let i = 0; i < Math.min(elements.length, 3); i++) {
						try {
							const id = await elements[i].getAttribute("id") || "none";
							const className = await elements[i].getAttribute("class") || "none";
							const text = await elements[i].getText() || "none";
							const type = await elements[i].getAttribute("type") || "none";
							const tagName = await elements[i].getTagName();

							console.log(`  ${i + 1}. <${tagName} id="${id}" class="${className}" type="${type}">${text}</${tagName}>`);
						} catch (e) {
							console.log(`  ${i + 1}. Error reading element`);
						}
					}
				}
			} catch (e) {
				// Selector not valid, skip
			}
		}

		// Get raw HTML body content to see what's actually there
		console.log("\n📝 First 500 characters of body HTML:");
		try {
			const bodyHTML = await driver.executeScript("return document.body.innerHTML");
			console.log(bodyHTML.substring(0, 500) + "...");
		} catch (e) {
			console.log("Could not get body HTML");
		}

		// Look for text that might indicate login elements
		console.log("\n🔍 Looking for login-related text:");
		const loginTexts = ["sign in", "login", "email", "password", "submit"];
		const bodyText = await driver.findElement(By.css("body")).getText().toLowerCase();

		for (const searchText of loginTexts) {
			if (bodyText.includes(searchText)) {
				console.log(`✅ Found text: "${searchText}"`);
			} else {
				console.log(`❌ No text: "${searchText}"`);
			}
		}

		// Try finding elements by partial text
		console.log("\n🎯 Looking for elements containing 'sign' or 'login' text:");
		const textSearches = [
			"//*[contains(text(), 'Sign')]",
			"//*[contains(text(), 'SIGN')]",
			"//*[contains(text(), 'Login')]",
			"//*[contains(text(), 'LOGIN')]",
			"//*[contains(text(), 'Submit')]"
		];

		for (const xpath of textSearches) {
			try {
				const elements = await driver.findElements(By.xpath(xpath));
				if (elements.length > 0) {
					console.log(`✅ Found ${elements.length} elements with xpath: ${xpath}`);
					for (let i = 0; i < Math.min(elements.length, 2); i++) {
						const text = await elements[i].getText();
						const tagName = await elements[i].getTagName();
						console.log(`  <${tagName}>${text}</${tagName}>`);
					}
				}
			} catch (e) {
				// Skip
			}
		}

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await driver.quit();
	}
}

deepDebugLogin();