import { By, until } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";
import { DEFAULT_PASSWORD } from "./utils/accounts.js";

async function simpleExploration() {
	const driver = await createDriver();

	try {
		console.log("🔍 Simple UI Exploration with Known Working Accounts");
		console.log("="  .repeat(60));

		// Use accounts we know work from the priority tests
		const workingAccounts = {
			learner: "A9-106821@area9.dk",    // Login Learner - we know this works
			educator: "A9-106816@area9.dk",   // Login Educator - we know this works
			curator: "A9-106810@area9.dk"     // Login Curator - we know this works
		};

		// 1. EXPLORE LEARNER DASHBOARD
		console.log("\n" + "="  .repeat(60));
		console.log("🎓 EXPLORING LEARNER DASHBOARD");
		console.log("="  .repeat(60));

		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Login as learner
		const learnerEmail = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);
		await learnerEmail.sendKeys(workingAccounts.learner);
		const learnerPassword = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 15000);
		await learnerPassword.sendKeys(DEFAULT_PASSWORD);
		const learnerButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 15000);
		await learnerButton.click();

		// Wait for dashboard
		await new Promise(resolve => setTimeout(resolve, 8000));
		console.log("✅ Logged in as learner");

		// Analyze learner dashboard
		console.log("\n📋 LEARNER DASHBOARD ANALYSIS:");

		// Look for all clickable elements
		const learnerClickables = await driver.findElements(By.css("button, a, [onclick], [role='button']"));
		console.log(`\nFound ${learnerClickables.length} clickable elements:`);

		for (let i = 0; i < Math.min(learnerClickables.length, 15); i++) {
			try {
				const element = learnerClickables[i];
				const text = await element.getText();
				const tagName = await element.getTagName();
				const id = await element.getAttribute("id") || "none";
				const ariaLabel = await element.getAttribute("aria-label") || "none";

				if (text && text.trim().length > 0 && text.length < 100) {
					console.log(`${i+1}. <${tagName} id="${id}" aria-label="${ariaLabel}">`);
					console.log(`   Text: "${text.trim()}"`);
				}
			} catch (e) {
				// Skip elements that can't be read
			}
		}

		// Look specifically for course/class content
		console.log("\n🎯 LOOKING FOR COURSE/CLASS ELEMENTS:");
		const courseElements = await driver.findElements(By.xpath("//*[contains(text(), 'Test') or contains(text(), 'Course') or contains(text(), 'SCORM') or contains(text(), 'Video')]"));
		for (let i = 0; i < Math.min(courseElements.length, 10); i++) {
			try {
				const text = await courseElements[i].getText();
				const tagName = await courseElements[i].getTagName();
				if (text && text.trim().length > 0) {
					console.log(`${i+1}. <${tagName}>${text.trim()}</${tagName}>`);
				}
			} catch (e) {
				// Skip
			}
		}

		await new Promise(resolve => setTimeout(resolve, 3000));

		// 2. EXPLORE EDUCATOR DASHBOARD
		console.log("\n" + "="  .repeat(60));
		console.log("👨‍🏫 EXPLORING EDUCATOR DASHBOARD");
		console.log("="  .repeat(60));

		await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Login as educator
		const educatorEmail = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);
		await educatorEmail.sendKeys(workingAccounts.educator);
		const educatorPassword = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 15000);
		await educatorPassword.sendKeys(DEFAULT_PASSWORD);
		const educatorButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 15000);
		await educatorButton.click();

		// Wait for dashboard
		await new Promise(resolve => setTimeout(resolve, 8000));
		console.log("✅ Logged in as educator");

		// Analyze educator dashboard
		console.log("\n📋 EDUCATOR DASHBOARD ANALYSIS:");

		const educatorClickables = await driver.findElements(By.css("button, a, [onclick], [role='button']"));
		console.log(`\nFound ${educatorClickables.length} clickable elements:`);

		for (let i = 0; i < Math.min(educatorClickables.length, 15); i++) {
			try {
				const element = educatorClickables[i];
				const text = await element.getText();
				const tagName = await element.getTagName();
				const id = await element.getAttribute("id") || "none";

				if (text && text.trim().length > 0 && text.length < 100) {
					console.log(`${i+1}. <${tagName} id="${id}">`);
					console.log(`   Text: "${text.trim()}"`);
				}
			} catch (e) {
				// Skip elements that can't be read
			}
		}

		// Look for navigation/menu items
		console.log("\n🧭 LOOKING FOR NAVIGATION ELEMENTS:");
		const navElements = await driver.findElements(By.xpath("//*[contains(text(), 'Review') or contains(text(), 'Class') or contains(text(), 'Analytics') or contains(text(), 'Create')]"));
		for (let i = 0; i < Math.min(navElements.length, 10); i++) {
			try {
				const text = await navElements[i].getText();
				const tagName = await navElements[i].getTagName();
				if (text && text.trim().length > 0) {
					console.log(`${i+1}. <${tagName}>${text.trim()}</${tagName}>`);
				}
			} catch (e) {
				// Skip
			}
		}

		await new Promise(resolve => setTimeout(resolve, 3000));

		// 3. EXPLORE CURATOR DASHBOARD
		console.log("\n" + "="  .repeat(60));
		console.log("👑 EXPLORING CURATOR DASHBOARD");
		console.log("="  .repeat(60));

		await driver.get("https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Login as curator
		const curatorEmail = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);
		await curatorEmail.sendKeys(workingAccounts.curator);
		const curatorPassword = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 15000);
		await curatorPassword.sendKeys(DEFAULT_PASSWORD);
		const curatorButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 15000);
		await curatorButton.click();

		// Wait for dashboard
		await new Promise(resolve => setTimeout(resolve, 8000));
		console.log("✅ Logged in as curator");

		// Analyze curator dashboard
		console.log("\n📋 CURATOR DASHBOARD ANALYSIS:");

		const curatorClickables = await driver.findElements(By.css("button, a, [onclick], [role='button']"));
		console.log(`\nFound ${curatorClickables.length} clickable elements:`);

		for (let i = 0; i < Math.min(curatorClickables.length, 15); i++) {
			try {
				const element = curatorClickables[i];
				const text = await element.getText();
				const tagName = await element.getTagName();
				const id = await element.getAttribute("id") || "none";

				if (text && text.trim().length > 0 && text.length < 100) {
					console.log(`${i+1}. <${tagName} id="${id}">`);
					console.log(`   Text: "${text.trim()}"`);
				}
			} catch (e) {
				// Skip elements that can't be read
			}
		}

		// Look for analytics-related items
		console.log("\n📊 LOOKING FOR ANALYTICS ELEMENTS:");
		const analyticsElements = await driver.findElements(By.xpath("//*[contains(text(), 'Analytics') or contains(text(), 'Report') or contains(text(), 'Unique') or contains(text(), 'Users')]"));
		for (let i = 0; i < Math.min(analyticsElements.length, 10); i++) {
			try {
				const text = await analyticsElements[i].getText();
				const tagName = await analyticsElements[i].getTagName();
				if (text && text.trim().length > 0) {
					console.log(`${i+1}. <${tagName}>${text.trim()}</${tagName}>`);
				}
			} catch (e) {
				// Skip
			}
		}

	} catch (error) {
		console.error("❌ Exploration error:", error.message);
	} finally {
		await driver.quit();
	}
}

console.log("🔧 Simple UI Exploration Tool\n");
simpleExploration();