import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { SmartWait } from './smart-wait.js';
import { NetworkWait } from './network-wait.js';
import { AppReadyState } from './app-ready.js';
import { SelectorBuilder } from './selector-builder.js';

// Convenience methods for smart waiting throughout the application
export const waitFor = {
	element: SmartWait.forElement.bind(SmartWait),
	elementWithFallbacks: SmartWait.forElementWithFallbacks.bind(SmartWait),
	smartClick: SmartWait.smartClick.bind(SmartWait),
	networkIdle: NetworkWait.forNetworkIdle.bind(NetworkWait),
	pageLoad: NetworkWait.forCompletePageLoad.bind(NetworkWait),
	scormReady: AppReadyState.waitForSCORMReady.bind(AppReadyState),
	navigationReady: AppReadyState.waitForNavigationReady.bind(AppReadyState),
	dataTable: AppReadyState.waitForDataTableReady.bind(AppReadyState),
	formReady: AppReadyState.waitForFormReady.bind(AppReadyState),
	classOperation: AppReadyState.waitForClassOperationComplete.bind(AppReadyState),
	loginComplete: AppReadyState.waitForLoginComplete.bind(AppReadyState),
	classContent: AppReadyState.waitForClassContentReady.bind(AppReadyState)
};

// Convenience methods for building robust selectors
export const selectorsFor = {
	area9: SelectorBuilder.area9,
	build: SelectorBuilder.buildRobustSelector.bind(SelectorBuilder),
	locators: SelectorBuilder.createLocatorArray.bind(SelectorBuilder)
};

export async function createDriver(visible = true, slowMode = false) {
	const options = new chrome.Options();

	// Use 'none' page load strategy for ARM Mac + Chrome 141 compatibility
	// This prevents hanging on navigation
	options.setPageLoadStrategy('none');

	// Base Chrome options for all modes
	const baseOptions = [
		'--no-sandbox',
		'--disable-dev-shm-usage',
		'--disable-blink-features=AutomationControlled',  // Prevent detection
		'--disable-extensions',
		'--disable-popup-blocking',
		'--disable-infobars'
	];

	// Add mode-specific options
	if (!visible) {
		options.addArguments([
			...baseOptions,
			'--headless=new',  // Use new headless mode
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

		// Set timeouts to prevent hanging
		await driver.manage().setTimeouts({
			pageLoad: 30000,      // 30 seconds for page load
			implicit: 0,          // Don't use implicit waits (we use explicit waits)
			script: 30000         // 30 seconds for async scripts
		});

		// Wrap driver.get() to handle 'none' page load strategy
		const originalGet = driver.get.bind(driver);
		driver.get = async function(url) {
			await originalGet(url);
			// With 'none' strategy, we need to wait for document.readyState
			await driver.executeScript('return document.readyState').catch(() => {});
			// Small delay to ensure page starts loading
			await new Promise(resolve => setTimeout(resolve, 500));
		};

		return driver;
	} catch (error) {
		console.error("❌ Failed to create Chrome driver:", error.message);
		console.log("\n💡 Troubleshooting tips:");
		console.log("1. Update Chrome browser: chrome://settings/help");
		console.log("2. Or install matching ChromeDriver: npm install chromedriver@<your-chrome-version>");
		throw error;
	}
}
