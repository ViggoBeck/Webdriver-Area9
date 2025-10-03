// Robust Selector Builder - Create reliable selectors for Area9 application elements
// Replaces fallback selector chains with intelligent single selectors

import { By } from "selenium-webdriver";

export class SelectorBuilder {
	/**
	 * Build a comprehensive selector that combines multiple targeting strategies
	 * Replaces the need for fallback selector chains
	 */
	static buildRobustSelector(options) {
		const {
			testId,
			text,
			className,
			tagName = '*',
			attributes = {},
			ariaLabel,
			contextElement = null,
			visible = true
		} = options;

		const selectors = [];

		// Priority 1: Test ID (most reliable for automated testing)
		if (testId) {
			selectors.push(`${tagName}[data-testid="${testId}"]`);
		}

		// Priority 2: Aria label (good for accessibility and stability)
		if (ariaLabel) {
			selectors.push(`${tagName}[aria-label="${ariaLabel}"]`);
			selectors.push(`${tagName}[aria-label*="${ariaLabel}"]`); // Partial match
		}

		// Priority 3: Text content (reliable for buttons/links)
		if (text) {
			// Exact text match
			selectors.push(`${tagName}[text()="${text}"]`);
			// Case insensitive partial match
			selectors.push(`${tagName}[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), "${text.toLowerCase()}")]`);
		}

		// Priority 4: Specific attribute combinations
		Object.entries(attributes).forEach(([key, value]) => {
			if (value.includes('*')) {
				// Wildcard match
				const pattern = value.replace('*', '');
				selectors.push(`${tagName}[${key}*="${pattern}"]`);
			} else {
				selectors.push(`${tagName}[${key}="${value}"]`);
			}
		});

		// Priority 5: Class name (less reliable but often necessary)
		if (className) {
			selectors.push(`${tagName}.${className}`);
		}

		// Combine selectors with OR logic
		let combinedSelector = selectors.join(', ');

		// Add visibility filter if requested
		if (visible && selectors.length > 0) {
			// Note: This is conceptual - actual visibility would be checked in SmartWait
			combinedSelector += ':visible';
		}

		// Add context if provided
		if (contextElement) {
			combinedSelector = selectors.map(s => `${contextElement} ${s}`).join(', ');
		}

		return combinedSelector;
	}

	/**
	 * Convert CSS selector string to Selenium By locator
	 * Handles both CSS and XPath patterns
	 */
	static toSeleniumLocator(selectorString) {
		// If selector contains XPath-specific syntax, use XPath
		if (selectorString.includes('contains(') ||
			selectorString.includes('text()') ||
			selectorString.includes('//') ||
			selectorString.includes('@')) {
			return By.xpath(`//${selectorString}`);
		}

		// Otherwise use CSS
		return By.css(selectorString);
	}

	/**
	 * Create multiple By locators from selector options
	 * Returns array of Selenium locators for use with SmartWait.forElementWithFallbacks
	 */
	static createLocatorArray(options) {
		const selectorString = this.buildRobustSelector(options);
		const selectors = selectorString.split(', ');

		return selectors.map(selector => this.toSeleniumLocator(selector.trim()));
	}

	/**
	 * Specific selectors for Area9 application components
	 * Using only VALID Selenium CSS and XPath selectors
	 */
	static area9 = {
		// Login components
		usernameField: () => By.css('input[name="username"]'),
		passwordField: () => By.css('input[name="password"]'),
		signInButton: () => By.id('sign_in'),

		// Dashboard components
		dashboard: (userType) => By.xpath(`//*[contains(text(),'${userType}') or contains(text(),'Dashboard')]`),

		// Overlay dismissal
		gotItButton: () => By.xpath("//*[normalize-space(text())='GOT IT']"),

		// Class management - using valid XPath/CSS only
		addClassButton: () => By.xpath("//button[@aria-label='add']"),
		classNameInput: () => By.css('input[name="name"]'),
		saveButton: () => By.xpath("//button[@aria-label='SAVE']"),
		classRow: (className) => By.xpath(`//tr[@role='row' and .//p[normalize-space()='${className}']]`),

		// Class content indicators
		classContentLoaded: () => By.css('div.nativeWidget[role="presentation"]'),
		learnerPerformanceText: () => By.xpath("//*[contains(text(),'learners') and contains(text(),'performance')]"),

		// Navigation
		showMenuButton: () => By.xpath("//button[@aria-label='Show Menu']"),
		logoutButton: () => By.xpath("//button[@aria-label='LOGOUT']")
	};
}
