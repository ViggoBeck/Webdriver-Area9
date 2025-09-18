import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export async function createDriver(visible = false, slowMode = false) {
	const options = new chrome.Options();

	// Base Chrome options for all modes
	const baseOptions = [
		'--no-sandbox',
		'--disable-web-security',
		'--allow-running-insecure-content'
	];

	// Add mode-specific options
	if (!visible) {
		options.addArguments([
			...baseOptions,
			'--disable-dev-shm-usage',
			'--disable-gpu'
		]);
	} else {
		// Visible mode - keep browser open and make it large
		options.addArguments([
			...baseOptions,
			'--window-size=1400,1000',
			'--start-maximized'
		]);

		if (slowMode) {
			console.log("🐌 Slow mode enabled - browser will stay open longer");
		}
	}

	try {
		// Let Selenium automatically manage ChromeDriver
		const driver = await new Builder()
			.forBrowser("chrome")
			.setChromeOptions(options)
			.build();



		return driver;
	} catch (error) {
		console.error("❌ Failed to create Chrome driver:", error.message);
		console.log("\n💡 Troubleshooting tips:");
		console.log("1. Update Chrome browser: chrome://settings/help");
		console.log("2. Or install matching ChromeDriver: npm install chromedriver@<your-chrome-version>");
		throw error;
	}
}