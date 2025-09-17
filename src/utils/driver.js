import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export async function createDriver(visible = false, slowMode = false, disableCache = false) {
	const options = new chrome.Options();

	// Base Chrome options for all modes
	const baseOptions = [
		'--no-sandbox',
		'--disable-web-security',
		'--allow-running-insecure-content'
	];

	// Cache control options
	if (disableCache) {
		const noCacheOptions = [
			'--disable-application-cache',
			'--disable-background-networking',
			'--disable-default-apps',
			'--disable-extensions',
			'--disable-sync',
			'--disable-translate',
			'--disable-plugins',
			'--disk-cache-size=1',
			'--media-cache-size=1',
			'--aggressive-cache-discard',
			'--disable-background-timer-throttling',
			'--disable-renderer-backgrounding',
			'--disable-backgrounding-occluded-windows'
		];
		baseOptions.push(...noCacheOptions);
		console.log("🚫 Cache disabled - testing cold load performance");
	} else {
		console.log("💾 Cache enabled - testing warm load performance");
	}

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

		// Additional cache disabling via Chrome DevTools Protocol
		if (disableCache) {
			try {
				// Enable Network domain and disable cache
				await driver.executeScript(`
					if (window.chrome && window.chrome.debugger) {
						chrome.debugger.attach({tabId: chrome.tabs.getCurrent().id}, "1.0");
						chrome.debugger.sendCommand({tabId: chrome.tabs.getCurrent().id}, "Network.enable");
						chrome.debugger.sendCommand({tabId: chrome.tabs.getCurrent().id}, "Network.setCacheDisabled", {cacheDisabled: true});
					}
				`);
			} catch (debugError) {
				// DevTools approach failed, but driver still works with command-line options
				console.log("⚠️ DevTools cache disable failed (using command-line options only)");
			}
		}

		return driver;
	} catch (error) {
		console.error("❌ Failed to create Chrome driver:", error.message);
		console.log("\n💡 Troubleshooting tips:");
		console.log("1. Update Chrome browser: chrome://settings/help");
		console.log("2. Or install matching ChromeDriver: npm install chromedriver@<your-chrome-version>");
		throw error;
	}
}