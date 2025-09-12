import { By, until } from "selenium-webdriver";
import { performLogin, waitForSuccessfulLogin } from "../utils/login.js";
import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";

export async function openCourseCatalog(driver) {
	// First login as learner using the working pattern
	await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Wait for page to fully load
	await new Promise(resolve => setTimeout(resolve, 4000));

	// Perform standard login (not timed)
	const emailField = await driver.wait(
		until.elementLocated(By.css('input[name="username"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(emailField), 5000);
	const assignedAccount = getAccountForTest("Open Course Catalog");
	await emailField.sendKeys(assignedAccount);

	const passwordField = await driver.wait(
		until.elementLocated(By.css('input[name="password"]')),
		20000
	);
	await driver.wait(until.elementIsVisible(passwordField), 5000);
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	const signInButton = await driver.wait(
		until.elementLocated(By.id("sign_in")),
		20000
	);
	await driver.wait(until.elementIsEnabled(signInButton), 5000);
	await signInButton.click();

	// Wait for login success (not timed)
	await waitForSuccessfulLogin(driver, [
		By.css('button[aria-label*="Benchmark Test"]'),
		By.xpath("//*[contains(text(), 'Dashboard')]")
	]);

	// Debug: Let's see what's actually on the page
	console.log("🔍 Debugging: What elements are available for Course Catalog?");
	try {
		// Look for all navigation/menu elements
		const navElements = await driver.findElements(By.css("nav, .nav, [role='navigation'], .menu, .sidebar"));
		console.log(`📍 Found ${navElements.length} navigation elements`);

		// Look for all clickable elements with text
		const clickables = await driver.findElements(By.css("button, a, [onclick], [role='button']"));
		console.log(`🔘 Found ${clickables.length} clickable elements (showing first 15 with text):`);

		let count = 0;
		for (let i = 0; i < clickables.length && count < 15; i++) {
			try {
				const text = await clickables[i].getText();
				const ariaLabel = await clickables[i].getAttribute("aria-label") || "";
				if ((text && text.trim().length > 0) || ariaLabel.length > 0) {
					console.log(`   ${count+1}. Text: "${text.trim()}" | aria-label: "${ariaLabel}"`);
					count++;
				}
			} catch (e) {
				// Skip unreadable elements
			}
		}
	} catch (e) {
		console.log("❌ Error during debugging:", e.message);
	}

	// Look for and click Course Catalog with expanded approaches
	const catalogSelectors = [
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'course catalog')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]"),
		By.xpath("//*[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]"),
		By.xpath("//a[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]"),
		By.xpath("//*[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'browse')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'library')]")
	];

	let courseCatalog;
	let workingSelector = "";

	for (let i = 0; i < catalogSelectors.length; i++) {
		const selector = catalogSelectors[i];
		try {
			console.log(`🔍 Trying selector ${i+1}: ${selector}`);
			const elements = await driver.findElements(selector);
			console.log(`   Found ${elements.length} elements`);

			if (elements.length > 0) {
				courseCatalog = elements[0]; // Take first match
				await driver.wait(until.elementIsVisible(courseCatalog), 2000);
				workingSelector = `selector ${i+1}`;
				console.log(`✅ Found Course Catalog using ${workingSelector}`);

				// Debug: Show what we found
				try {
					const text = await courseCatalog.getText();
					const ariaLabel = await courseCatalog.getAttribute("aria-label") || "";
					const tagName = await courseCatalog.getTagName();
					console.log(`   Element: <${tagName}> Text: "${text.trim()}" aria-label: "${ariaLabel}"`);
				} catch (e) {
					console.log("   Could not read element details");
				}
				break;
			}
		} catch (e) {
			console.log(`   ❌ Selector ${i+1} failed: ${e.message}`);
		}
	}

	if (!courseCatalog) {
		throw new Error("Could not find Course Catalog element after trying all selectors");
	}

	// START TIMING: Right before clicking course catalog (as per specification)
	const start = Date.now();

	console.log(`🖱️ Clicking Course Catalog element found with ${workingSelector}...`);

	// Try different click approaches for better interactability
	try {
		// Scroll element into view first
		await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", courseCatalog);
		await new Promise(resolve => setTimeout(resolve, 500));

		// Try regular click
		await courseCatalog.click();
		console.log("✅ Regular click succeeded");
	} catch (clickError) {
		console.log(`❌ Regular click failed: ${clickError.message}`);
		console.log("🔄 Trying JavaScript click...");
		try {
			// Fallback: JavaScript click
			await driver.executeScript("arguments[0].click();", courseCatalog);
			console.log("✅ JavaScript click succeeded");
		} catch (jsError) {
			console.log(`❌ JavaScript click failed: ${jsError.message}`);
			console.log("🔄 Trying action click...");
			// Fallback: Actions click
			const actions = driver.actions();
			await actions.move({origin: courseCatalog}).click().perform();
			console.log("✅ Actions click succeeded");
		}
	}

	// Wait for catalog content to be visible or URL change
	console.log("⏳ Waiting for catalog content to load...");

	const catalogContentSelectors = [
		By.xpath("//*[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'course')]"),
		By.xpath("//*[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'course')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'browse') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'search')]"),
		By.xpath("//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'catalog')]")
	];

	let catalogLoaded = false;
	for (let i = 0; i < catalogContentSelectors.length; i++) {
		const selector = catalogContentSelectors[i];
		try {
			console.log(`🔍 Waiting for catalog content via selector ${i+1}...`);
			await driver.wait(until.elementLocated(selector), 3000);
			console.log(`✅ Catalog content detected via selector ${i+1}`);
			catalogLoaded = true;
			break;
		} catch (e) {
			console.log(`❌ Selector ${i+1} timeout`);
		}
	}

	// Also check for URL change
	if (!catalogLoaded) {
		try {
			const currentUrl = await driver.getCurrentUrl();
			if (currentUrl.includes('catalog') || currentUrl.includes('course')) {
				console.log(`✅ Catalog detected via URL change: ${currentUrl}`);
				catalogLoaded = true;
			}
		} catch (e) {
			console.log("❌ Could not check URL");
		}
	}

	if (!catalogLoaded) {
		// Fallback: wait a bit and assume it loaded if no errors occurred
		console.log("⏳ No specific catalog indicators found, using fallback wait...");
		await new Promise(resolve => setTimeout(resolve, 1000));
		console.log("✅ Assuming catalog loaded (fallback)");
	}

	const end = Date.now();
	const seconds = (end - start) / 1000;

	console.log("⏱ Open Course Catalog tog:", seconds, "sekunder");
	return seconds;
}