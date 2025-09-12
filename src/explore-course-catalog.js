import { By, until } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "./utils/accounts.js";

async function exploreCatalogSpecifically() {
	const driver = await createDriver();

	try {
		console.log("🔍 Detailed Course Catalog Exploration");
		console.log("="  .repeat(50));

		const account = getAccountForTest("Open Course Catalog");
		console.log(`👤 Using account: ${account}`);

		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Login
		const emailField = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 20000);
		await emailField.sendKeys(account);

		const passwordField = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 20000);
		await passwordField.sendKeys(DEFAULT_PASSWORD);

		const signInButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 20000);
		await signInButton.click();

		// Wait for login
		await new Promise(resolve => setTimeout(resolve, 5000));
		console.log("✅ Login successful");

		// Get all clickable elements with their positions
		console.log("\n📍 Analyzing all clickable elements by position:");
		const allClickable = await driver.findElements(By.css("button, a, [onclick], [role='button'], .clickable"));

		for (let i = 0; i < allClickable.length; i++) {
			try {
				const element = allClickable[i];
				const text = await element.getText();
				const tagName = await element.getTagName();
				const id = await element.getAttribute("id") || "none";
				const className = await element.getAttribute("class") || "none";
				const rect = await element.getRect();

				if (text && text.trim().length > 0 && text.length < 50) {
					console.log(`${i+1}. <${tagName} id="${id}" class="${className}">`);
					console.log(`   Text: "${text.trim()}"`);
					console.log(`   Position: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, w=${Math.round(rect.width)}, h=${Math.round(rect.height)}`);
					console.log();
				}
			} catch (e) {
				// Skip elements that can't be read
			}
		}

		// Look specifically for catalog-related terms
		console.log("\n🔍 Searching for catalog-related elements:");
		const catalogTerms = ["catalog", "catalogue", "course", "browse", "search", "library"];

		for (const term of catalogTerms) {
			const elements = await driver.findElements(By.xpath(`//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${term}')]`));
			if (elements.length > 0) {
				console.log(`✅ Found ${elements.length} elements containing '${term}':`);
				for (let i = 0; i < Math.min(elements.length, 3); i++) {
					try {
						const text = await elements[i].getText();
						const tagName = await elements[i].getTagName();
						console.log(`   <${tagName}>${text}</${tagName}>`);
					} catch (e) {
						console.log(`   Error reading element ${i+1}`);
					}
				}
			} else {
				console.log(`❌ No elements found containing '${term}'`);
			}
		}

		// Take a screenshot of the current state for manual inspection
		console.log("\n📸 Taking screenshot for manual inspection...");
		try {
			await driver.takeScreenshot().then(function(image) {
				require('fs').writeFileSync('./learner-dashboard.png', image, 'base64');
				console.log("✅ Screenshot saved as learner-dashboard.png");
			});
		} catch (e) {
			console.log("❌ Could not take screenshot:", e.message);
		}

		// Try clicking on likely navigation elements
		console.log("\n🖱️ Testing navigation elements:");
		const navSelectors = [
			"nav a", ".nav a", ".menu a", ".sidebar a",
			"[role='navigation'] a", ".navigation a"
		];

		for (const selector of navSelectors) {
			try {
				const navElements = await driver.findElements(By.css(selector));
				if (navElements.length > 0) {
					console.log(`Found ${navElements.length} navigation elements with: ${selector}`);
					for (let i = 0; i < Math.min(navElements.length, 3); i++) {
						const text = await navElements[i].getText();
						if (text && text.trim().length > 0) {
							console.log(`  - "${text.trim()}"`);
						}
					}
				}
			} catch (e) {
				// Skip invalid selectors
			}
		}

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await driver.quit();
	}
}

exploreCatalogSpecifically();