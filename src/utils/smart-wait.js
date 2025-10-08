// Smart Wait Utilities - Intelligent waiting to replace hardcoded delays
import { By, until } from "selenium-webdriver";
import { logger } from './logger.js';

export class SmartWait {
	/**
	 * Progressive timeout strategy: start short, escalate as needed
	 * Replaces hardcoded delays with intelligent application state detection
	 */
	static async forElement(driver, locator, options = {}) {
		const {
			timeout = 15000,
			stable = true,
			visible = true,
			clickable = false,
			polling = 100,
			errorPrefix = 'Element'
		} = options;

		// Progressive escalation strategy instead of fixed waits
		const timeouts = [2000, 5000, timeout];
		let lastError;

		for (const currentTimeout of timeouts) {
			try {
				const element = await this.findWithConditions(
					driver, locator, currentTimeout, { stable, visible, clickable, polling }
				);

				// Only log on final timeout success or if in debug mode
				if (currentTimeout === timeouts[timeouts.length - 1]) {
					logger.verbose(`✅ ${errorPrefix} found with ${currentTimeout}ms timeout`);
				}
				return element;

			} catch (error) {
				lastError = error;
				logger.verbose(`⚠️ ${errorPrefix} not ready with ${currentTimeout}ms timeout, escalating...`);

				// Small buffer between escalation attempts
				await this.sleep(200);
			}
		}

		throw new Error(`${errorPrefix} failed after all timeout strategies: ${lastError.message}`);
	}

	/**
	 * Find element with multiple stability/interaction conditions
	 * Addresses the issue where elements exist but aren't ready for interaction
	 */
	static async findWithConditions(driver, locator, timeout, conditions) {
		const element = await driver.wait(until.elementLocated(locator), timeout);

		if (conditions.visible) {
			await driver.wait(until.elementIsVisible(element), Math.min(timeout, 5000));
		}

		if (conditions.stable) {
			await this.waitForStability(driver, element, 500);
		}

		if (conditions.clickable) {
			await driver.wait(until.elementIsEnabled(element), Math.min(timeout, 3000));
			await this.waitForClickable(driver, element);
		}

		return element;
	}

	/**
	 * Wait for element to be stable (not moving/resizing)
	 * Solves the issue where elements are found but still rendering
	 */
	static async waitForStability(driver, element, duration = 500) {
		let lastRect = await element.getRect();
		let stableStart = Date.now();

		while (Date.now() - stableStart < duration) {
			await this.sleep(50);
			const currentRect = await element.getRect();

			if (this.rectsEqual(lastRect, currentRect)) {
				continue; // Still stable
			} else {
				lastRect = currentRect;
				stableStart = Date.now(); // Reset stability timer
			}
		}
	}

	/**
	 * Check if element rectangles are equal (for stability detection)
	 */
	static rectsEqual(rect1, rect2) {
		return rect1.x === rect2.x && rect1.y === rect2.y &&
			   rect1.width === rect2.width && rect1.height === rect2.height;
	}

	/**
	 * Wait for element to be truly clickable (not obscured)
	 * Solves retry loops where clicks fail due to element overlay/obstruction
	 */
	static async waitForClickable(driver, element) {
		const maxAttempts = 10;
		let attempts = 0;

		while (attempts < maxAttempts) {
			const isClickable = await driver.executeScript(`
				const element = arguments[0];
				const rect = element.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				// Check if element is in viewport
				if (centerX < 0 || centerY < 0 ||
					centerX > window.innerWidth || centerY > window.innerHeight) {
					return false;
				}

				// Check if element at center point is the target element or its child
				const elementAtCenter = document.elementFromPoint(centerX, centerY);
				return element === elementAtCenter || element.contains(elementAtCenter);
			`, element);

			if (isClickable) return true;

			attempts++;
			await this.sleep(100);
		}

		throw new Error('Element is not clickable (obscured or out of viewport)');
	}

	/**
	 * Robust element finding with multiple selector strategies
	 * Replaces the fallback selector chains in your current code
	 */
	static async forElementWithFallbacks(driver, selectors, options = {}) {
		const { errorPrefix = 'Element', ...waitOptions } = options;

		for (let i = 0; i < selectors.length; i++) {
			try {
				logger.verbose(`🔍 Trying ${errorPrefix} selector ${i + 1}: ${selectors[i]}`);
				const element = await this.forElement(driver, selectors[i], {
					...waitOptions,
					timeout: 3000, // Shorter timeout for individual attempts
					errorPrefix: `${errorPrefix} (selector ${i + 1})`
				});

				logger.debug(`✅ ${errorPrefix} found using selector ${i + 1}`);
				return element;

			} catch (error) {
				logger.verbose(`❌ ${errorPrefix} selector ${i + 1} failed: ${error.message}`);
				if (i === selectors.length - 1) {
					throw new Error(`${errorPrefix} not found with any selector: ${error.message}`);
				}
			}
		}
	}

	/**
	 * Smart click that handles various click failure scenarios
	 * Replaces try/catch blocks around element clicks
	 */
	static async smartClick(driver, element, options = {}) {
		const { scrollIntoView = true, jsClickFallback = true, maxAttempts = 3 } = options;

		// Ensure element is ready for interaction
		await this.waitForClickable(driver, element);

		if (scrollIntoView) {
			await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", element);
			await this.sleep(200); // Brief pause after scrolling
		}

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				await element.click();
				logger.verbose(`✅ Smart click succeeded (attempt ${attempt})`);
				return;
			} catch (error) {
				logger.verbose(`⚠️ Click attempt ${attempt} failed: ${error.message}`);

				if (attempt === maxAttempts) {
					if (jsClickFallback) {
						logger.debug(`🔄 Falling back to JavaScript click`);
						await driver.executeScript("arguments[0].click();", element);
						logger.debug(`✅ JavaScript click succeeded`);
						return;
					} else {
						throw error;
					}
				}

				await this.sleep(500); // Wait between click attempts
			}
		}
	}

	/**
	 * Promise-based sleep utility
	 */
	static sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
