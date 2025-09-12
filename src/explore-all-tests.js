import { By, until } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "./utils/accounts.js";

// Helper to perform login and return to a clean state
async function loginAndExplore(driver, role, testName, explorationCallback) {
	console.log(`\n${'='.repeat(60)}`);
	console.log(`🔍 Exploring: ${testName} (${role.toUpperCase()})`);
	console.log(`${'='.repeat(60)}`);

	try {
		const account = getAccountForTest(testName);
		console.log(`👤 Using account: ${account}`);

		// Get the correct URL for the role
		let baseUrl;
		if (role === 'learner') {
			baseUrl = "https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
		} else if (role === 'educator') {
			baseUrl = "https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
		} else if (role === 'curator') {
			baseUrl = "https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
		}

		await driver.get(baseUrl);
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Perform login
		const emailField = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 20000);
		await emailField.sendKeys(account);

		const passwordField = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 20000);
		await passwordField.sendKeys(DEFAULT_PASSWORD);

		const signInButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 20000);
		await signInButton.click();

		// Wait for login to complete
		await new Promise(resolve => setTimeout(resolve, 5000));

		// Let the login form disappear
		try {
			await driver.wait(until.stalenessOf(emailField), 10000);
		} catch (e) {
			// Continue anyway
		}

		console.log(`✅ Login successful for ${role}`);

		// Run the specific exploration
		await explorationCallback(driver);

	} catch (error) {
		console.error(`❌ Error exploring ${testName}:`, error.message);
	}
}

async function exploreAllTests() {
	const driver = await createDriver();

	try {
		// 1. OPEN REVIEW (Educator)
		await loginAndExplore(driver, 'educator', 'Open Review', async (driver) => {
			console.log("🔍 Looking for Reviews tab/section...");

			// Look for navigation elements
			const navElements = await driver.findElements(By.css("nav, .nav, [role='navigation'], .menu, .tabs, .sidebar"));
			console.log(`Found ${navElements.length} navigation elements`);

			// Look for text containing "Review"
			const reviewElements = await driver.findElements(By.xpath("//*[contains(text(), 'Review')]"));
			console.log(`Found ${reviewElements.length} elements containing 'Review':`);

			for (let i = 0; i < Math.min(reviewElements.length, 5); i++) {
				try {
					const text = await reviewElements[i].getText();
					const tagName = await reviewElements[i].getTagName();
					const id = await reviewElements[i].getAttribute("id") || "none";
					const className = await reviewElements[i].getAttribute("class") || "none";
					console.log(`  ${i+1}. <${tagName} id="${id}" class="${className}">${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}

			// Try the specific URL from specifications
			console.log("\n🔗 Trying direct navigation to review URL...");
			await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=classcontent");
			await new Promise(resolve => setTimeout(resolve, 3000));

			console.log("📝 Page content after direct navigation:");
			const reviewPageElements = await driver.findElements(By.xpath("//*[contains(text(), 'Review') or contains(text(), 'review')]"));
			console.log(`Found ${reviewPageElements.length} review-related elements on direct navigation`);
		});

		await new Promise(resolve => setTimeout(resolve, 2000));

		// 2. OPEN SCORM (Learner)
		await loginAndExplore(driver, 'learner', 'Open SCORM', async (driver) => {
			console.log("🔍 Looking for SCORM classes on dashboard...");

			// Look for class/course elements
			const classElements = await driver.findElements(By.xpath("//*[contains(text(), 'SCORM') or contains(text(), 'Benchmark') or contains(@aria-label, 'Benchmark')]"));
			console.log(`Found ${classElements.length} potential SCORM/class elements:`);

			for (let i = 0; i < Math.min(classElements.length, 5); i++) {
				try {
					const text = await classElements[i].getText();
					const tagName = await classElements[i].getTagName();
					const id = await classElements[i].getAttribute("id") || "none";
					const className = await classElements[i].getAttribute("class") || "none";
					const ariaLabel = await classElements[i].getAttribute("aria-label") || "none";
					console.log(`  ${i+1}. <${tagName} id="${id}" class="${className}" aria-label="${ariaLabel}">${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}

			// Look for clickable course/class items
			console.log("\n🎯 Looking for clickable course items...");
			const clickableElements = await driver.findElements(By.css("button, a, [onclick], .course, .class, [role='button']"));
			console.log(`Found ${clickableElements.length} potentially clickable elements (showing first 10):`);

			for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
				try {
					const text = await clickableElements[i].getText();
					const tagName = await clickableElements[i].getTagName();
					const id = await clickableElements[i].getAttribute("id") || "none";
					if (text && text.trim().length > 0 && text.length < 100) {
						console.log(`  ${i+1}. <${tagName} id="${id}">${text.trim()}</${tagName}>`);
					}
				} catch (e) {
					// Skip
				}
			}
		});

		await new Promise(resolve => setTimeout(resolve, 2000));

		// 3. OPEN VIDEO PROBE (Learner) - different account
		await loginAndExplore(driver, 'learner', 'Open Video Probe', async (driver) => {
			console.log("🔍 Looking for Video classes on dashboard...");

			const videoElements = await driver.findElements(By.xpath("//*[contains(text(), 'Video') or contains(text(), 'video')]"));
			console.log(`Found ${videoElements.length} video-related elements:`);

			for (let i = 0; i < Math.min(videoElements.length, 3); i++) {
				try {
					const text = await videoElements[i].getText();
					const tagName = await videoElements[i].getTagName();
					console.log(`  ${i+1}. <${tagName}>${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}
		});

		await new Promise(resolve => setTimeout(resolve, 2000));

		// 4. ANALYTICS EDUCATOR
		await loginAndExplore(driver, 'educator', 'Analytics Educator', async (driver) => {
			console.log("🔍 Looking for Analytics navigation...");

			// Try direct URL first
			await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#home&t=classes/class&class=785&t=analytics");
			await new Promise(resolve => setTimeout(resolve, 3000));

			console.log("📊 Looking for analytics elements...");
			const analyticsElements = await driver.findElements(By.xpath("//*[contains(text(), 'Analytics') or contains(text(), 'Activity') or contains(text(), 'Log') or contains(text(), 'Learner')]"));
			console.log(`Found ${analyticsElements.length} analytics-related elements:`);

			for (let i = 0; i < Math.min(analyticsElements.length, 5); i++) {
				try {
					const text = await analyticsElements[i].getText();
					const tagName = await analyticsElements[i].getTagName();
					const id = await analyticsElements[i].getAttribute("id") || "none";
					console.log(`  ${i+1}. <${tagName} id="${id}">${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}

			// Look for filter controls
			console.log("\n🔧 Looking for filter controls...");
			const filterElements = await driver.findElements(By.css("select, .filter, .dropdown, input[type='checkbox'], button[contains(text(), 'Filter')]"));
			console.log(`Found ${filterElements.length} potential filter elements`);
		});

		await new Promise(resolve => setTimeout(resolve, 2000));

		// 5. ANALYTICS CURATOR
		await loginAndExplore(driver, 'curator', 'Analytics Curator - Unique Users', async (driver) => {
			console.log("🔍 Exploring curator analytics...");

			// Look for Analytics menu/link
			const analyticsLinks = await driver.findElements(By.xpath("//*[contains(text(), 'Analytics') or contains(text(), 'Report')]"));
			console.log(`Found ${analyticsLinks.length} analytics/report links:`);

			for (let i = 0; i < Math.min(analyticsLinks.length, 3); i++) {
				try {
					const text = await analyticsLinks[i].getText();
					const tagName = await analyticsLinks[i].getTagName();
					console.log(`  ${i+1}. <${tagName}>${text}</${tagName}>`);

					// Try clicking the first analytics link
					if (i === 0) {
						console.log("🖱️ Trying to click first analytics link...");
						await analyticsLinks[i].click();
						await new Promise(resolve => setTimeout(resolve, 3000));

						// Look for report options
						console.log("📊 Looking for report options...");
						const reportElements = await driver.findElements(By.xpath("//*[contains(text(), 'Unique') or contains(text(), 'Project') or contains(text(), 'Team')]"));
						console.log(`Found ${reportElements.length} report option elements:`);

						for (let j = 0; j < Math.min(reportElements.length, 3); j++) {
							try {
								const reportText = await reportElements[j].getText();
								const reportTag = await reportElements[j].getTagName();
								console.log(`    Report ${j+1}. <${reportTag}>${reportText}</${reportTag}>`);
							} catch (e) {
								console.log(`    Report ${j+1}. Error reading element`);
							}
						}
						break;
					}
				} catch (e) {
					console.log(`  ${i+1}. Error clicking element`);
				}
			}
		});

		await new Promise(resolve => setTimeout(resolve, 2000));

		// 6. CLASS MANAGEMENT (Educator)
		await loginAndExplore(driver, 'educator', 'Open Class', async (driver) => {
			console.log("🔍 Looking for class management elements...");

			// Look for classes/courses
			const classElements = await driver.findElements(By.xpath("//*[contains(text(), 'Class') or contains(text(), 'Benchmark Test')]"));
			console.log(`Found ${classElements.length} class-related elements:`);

			for (let i = 0; i < Math.min(classElements.length, 5); i++) {
				try {
					const text = await classElements[i].getText();
					const tagName = await classElements[i].getTagName();
					const id = await classElements[i].getAttribute("id") || "none";
					console.log(`  ${i+1}. <${tagName} id="${id}">${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}

			// Look for create/add buttons
			console.log("\n➕ Looking for create class buttons...");
			const createElements = await driver.findElements(By.xpath("//*[contains(text(), 'Create') or contains(text(), 'Add') or contains(text(), 'New') or text()='+']"));
			console.log(`Found ${createElements.length} potential create buttons:`);

			for (let i = 0; i < Math.min(createElements.length, 3); i++) {
				try {
					const text = await createElements[i].getText();
					const tagName = await createElements[i].getTagName();
					console.log(`  ${i+1}. <${tagName}>${text}</${tagName}>`);
				} catch (e) {
					console.log(`  ${i+1}. Error reading element`);
				}
			}
		});

	} catch (error) {
		console.error("❌ General exploration error:", error);
	} finally {
		await driver.quit();
	}
}

console.log(`
🕵️ Area9 Complete Test Exploration
This will systematically explore all test scenarios to find the real HTML selectors.
`);

exploreAllTests();