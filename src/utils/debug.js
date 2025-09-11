import { By, until } from "selenium-webdriver";

// Debug helper to inspect page elements
export async function debugPageElements(driver, testName) {
	console.log(`\n🔍 Debugging ${testName}:`);

	try {
		// Get current URL
		const currentUrl = await driver.getCurrentUrl();
		console.log(`📍 Current URL: ${currentUrl}`);

		// Get page title
		const title = await driver.getTitle();
		console.log(`📄 Page title: ${title}`);

		// Check if page is loaded
		const readyState = await driver.executeScript("return document.readyState");
		console.log(`⏳ Page ready state: ${readyState}`);

		// Look for common login form elements
		const commonSelectors = [
			'input[name="username"]',
			'input[name="email"]',
			'input[type="email"]',
			'input[placeholder*="email"]',
			'input[placeholder*="username"]',
			'#username',
			'#email',
			'.username',
			'.email'
		];

		console.log("🔎 Checking for login form elements:");
		for (const selector of commonSelectors) {
			try {
				const elements = await driver.findElements(By.css(selector));
				if (elements.length > 0) {
					console.log(`✅ Found: ${selector} (${elements.length} elements)`);
					// Get the actual element attributes
					for (let i = 0; i < Math.min(elements.length, 2); i++) {
						const tagName = await elements[i].getTagName();
						const type = await elements[i].getAttribute("type");
						const name = await elements[i].getAttribute("name");
						const placeholder = await elements[i].getAttribute("placeholder");
						console.log(`   Element ${i}: <${tagName} type="${type}" name="${name}" placeholder="${placeholder}">`);
					}
				} else {
					console.log(`❌ Not found: ${selector}`);
				}
			} catch (e) {
				console.log(`❌ Error checking ${selector}: ${e.message}`);
			}
		}

		// Look for common dashboard/success elements
		const dashboardSelectors = [
			"//*[text()='Dashboard']",
			"//*[contains(text(), 'Dashboard')]",
			"//*[contains(text(), 'Welcome')]",
			"//*[contains(@class, 'dashboard')]",
			"//*[contains(@class, 'main')]",
			"//*[contains(@class, 'home')]"
		];

		console.log("🏠 Checking for dashboard elements:");
		for (const selector of dashboardSelectors) {
			try {
				const elements = await driver.findElements(By.xpath(selector));
				if (elements.length > 0) {
					console.log(`✅ Found dashboard element: ${selector} (${elements.length} elements)`);
					for (let i = 0; i < Math.min(elements.length, 2); i++) {
						const text = await elements[i].getText();
						const tagName = await elements[i].getTagName();
						console.log(`   Element ${i}: <${tagName}>${text}</${tagName}>`);
					}
				} else {
					console.log(`❌ Dashboard not found: ${selector}`);
				}
			} catch (e) {
				console.log(`❌ Error checking dashboard ${selector}: ${e.message}`);
			}
		}

		// Get all visible text content for manual inspection
		try {
			const bodyText = await driver.findElement(By.css("body")).getText();
			const lines = bodyText.split('\n').filter(line => line.trim().length > 0);
			console.log("📝 Page content (first 10 non-empty lines):");
			lines.slice(0, 10).forEach((line, i) => {
				console.log(`   ${i + 1}: ${line.trim()}`);
			});
		} catch (e) {
			console.log("❌ Could not get page text content");
		}

	} catch (error) {
		console.log(`❌ Debug error: ${error.message}`);
	}

	console.log("🔍 Debug complete\n");
}

// Wait for page to be fully loaded
export async function waitForPageLoad(driver, timeout = 30000) {
	await driver.wait(
		async () => {
			const readyState = await driver.executeScript("return document.readyState");
			return readyState === "complete";
		},
		timeout,
		"Page did not finish loading"
	);
}