import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export async function createDriver() {
	const options = new chrome.Options();

	// Add useful Chrome options
	options.addArguments([
		'--no-sandbox',
		'--disable-dev-shm-usage',
		'--disable-gpu',
		'--window-size=1920,1080',
		'--disable-web-security',
		'--allow-running-insecure-content'
	]);

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