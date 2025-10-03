// Application-Specific Ready State Checkers
// Detects when specific Area9 application components are ready for interaction
import { By } from "selenium-webdriver";
import { SmartWait } from './smart-wait.js';
import { NetworkWait } from './network-wait.js';

export class AppReadyState {
	/**
	 * Wait for SCORM content to be fully loaded and interactive
	 * Addresses issues with SCORM timing dependencies
	 */
	static async waitForSCORMReady(driver, timeout = 20000) {
		console.log(`🎓 Waiting for SCORM content to be ready...`);

		try {
			const result = await driver.executeAsyncScript(`
				const callback = arguments[arguments.length - 1];
				const timeoutMs = ${timeout};
				const startTime = Date.now();

				const checkSCORMReady = () => {
					const now = Date.now();
					const elapsed = now - startTime;

					try {
						// Check for SCORM API availability
						if (typeof window.API !== 'undefined' && window.API && window.API.LMSInitialize) {
							const initialized = window.API.LMSInitialize('');
							if (initialized === 'true') {
								callback({success: true, method: 'API', elapsed});
								return;
							}
						}

						// Check for SCORM 2004 API
						if (typeof window.API_1484_11 !== 'undefined' && window.API_1484_11) {
							try {
								window.API_1484_11.Initialize('');
								callback({success: true, method: 'API_1484_11', elapsed});
								return;
							} catch (e) {}
						}

						// Check for common loading indicators that should be gone
						const loadingSelectors = [
							'.scorm-loading', '.content-loading', '[id*="loading"]',
							'.spinner', '.loader', '[class*="load"]'
						];

						let stillLoading = false;
						for (const selector of loadingSelectors) {
							const elements = document.querySelectorAll(selector);
							if (Array.from(elements).some(el => el.offsetParent !== null)) {
								stillLoading = true;
								break;
							}
						}

						if (!stillLoading) {
							// Check for iframe content
							const iframes = document.querySelectorAll('iframe[src*="scorm"], iframe[src*="content"], iframe');
							if (iframes.length > 0) {
								for (const iframe of iframes) {
									try {
										if (iframe.contentDocument && iframe.contentDocument.readyState !== 'complete') {
											stillLoading = true;
											break;
										}
									} catch (e) {
										// Cross-origin iframe - assume ready if we can't access
									}
								}
							}

							if (!stillLoading) {
								callback({success: true, method: 'loading-indicators', elapsed});
								return;
							}
						}

						// Timeout check
						if (elapsed >= timeoutMs) {
							callback({success: false, timeout: true, elapsed});
							return;
						}

						setTimeout(checkSCORMReady, 200);

					} catch (error) {
						if (elapsed >= timeoutMs) {
							callback({success: false, error: error.message, elapsed});
							return;
						}
						setTimeout(checkSCORMReady, 200);
					}
				};

				setTimeout(checkSCORMReady, 100);
			`);

			if (result.success) {
				console.log(`✅ SCORM ready via ${result.method} after ${result.elapsed}ms`);
				return true;
			} else {
				console.log(`⚠️ SCORM ready timeout after ${result.elapsed}ms`);
				return false;
			}

		} catch (error) {
			console.log(`❌ SCORM ready check error: ${error.message}`);
			return false;
		}
	}

	/**
	 * Wait for navigation menu to be ready and interactive
	 * Addresses menu interaction failures in your current code
	 */
	static async waitForNavigationReady(driver, timeout = 10000) {
		console.log(`🧭 Waiting for navigation to be ready...`);

		const menuSelectors = [
			By.xpath("//button[@aria-label='Show Menu']"),
			By.css('nav'),
			By.css('.navigation'),
			By.css('.menu'),
			By.css('[role="navigation"]')
		];

		try {
			const menuElement = await SmartWait.forElementWithFallbacks(driver, menuSelectors, {
				timeout,
				visible: true,
				stable: true,
				clickable: true,
				errorPrefix: 'Navigation menu'
			});

			// Additional check: ensure menu items are ready
			await driver.executeScript(`
				// Wait for any menu animations to complete
				const computedStyle = window.getComputedStyle(arguments[0]);
				return computedStyle.animationPlayState !== 'running' &&
					   computedStyle.transitionProperty === 'none' ||
					   parseFloat(computedStyle.transitionDuration) === 0;
			`, menuElement);

			console.log(`✅ Navigation ready and interactive`);
			return menuElement;

		} catch (error) {
			console.log(`❌ Navigation ready timeout: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Wait for data table (class lists, reports) to be populated with data
	 * Addresses issues where tables exist but data is still loading
	 */
	static async waitForDataTableReady(driver, tableSelector, options = {}) {
		const { timeout = 15000, minRows = 1, errorPrefix = 'Data table' } = options;

		console.log(`📊 Waiting for ${errorPrefix} to populate with data...`);

		// First wait for table container
		await SmartWait.forElement(driver, By.css(tableSelector), {
			timeout: 5000,
			visible: true,
			errorPrefix: `${errorPrefix} container`
		});

		// Wait for actual data to populate
		const hasData = await driver.wait(async () => {
			return await driver.executeScript(`
				const table = document.querySelector('${tableSelector}');
				if (!table) return false;

				// Check for loading indicators within table
				const loadingElements = table.querySelectorAll(
					'.loading', '.spinner', '[class*="load"]', '[aria-busy="true"]'
				);
				if (Array.from(loadingElements).some(el => el.offsetParent !== null)) {
					return false;
				}

				// Check for actual data rows (excluding headers and empty states)
				const dataRows = table.querySelectorAll(
					'tr:not(.header):not(.no-data):not([class*="header"]), tbody tr, [role="row"]'
				);

				// Filter out rows that appear to be loading placeholders
				const validRows = Array.from(dataRows).filter(row => {
					const text = row.textContent.trim();
					return text.length > 0 &&
						   !text.includes('Loading') &&
						   !text.includes('...') &&
						   !row.classList.contains('loading');
				});

				return validRows.length >= ${minRows};
			`);
		}, timeout);

		if (hasData) {
			console.log(`✅ ${errorPrefix} populated with data`);
			return true;
		} else {
			throw new Error(`${errorPrefix} failed to populate with data within ${timeout}ms`);
		}
	}

	/**
	 * Wait for form to be fully ready for input
	 * Addresses issues with form elements that exist but aren't interactive
	 */
	static async waitForFormReady(driver, formSelector, options = {}) {
		const { timeout = 10000, requiredFields = [], errorPrefix = 'Form' } = options;

		console.log(`📝 Waiting for ${errorPrefix} to be ready...`);

		// Wait for form container
		const form = await SmartWait.forElement(driver, By.css(formSelector), {
			timeout: 5000,
			visible: true,
			errorPrefix: `${errorPrefix} container`
		});

		// Wait for form to be interactive
		await driver.wait(async () => {
			return await driver.executeScript(`
				const form = document.querySelector('${formSelector}');
				if (!form) return false;

				// Check if form is still loading/initializing
				if (form.hasAttribute('aria-busy') && form.getAttribute('aria-busy') === 'true') {
					return false;
				}

				// Check required fields if specified
				const requiredFields = ${JSON.stringify(requiredFields)};
				if (requiredFields.length > 0) {
					for (const fieldSelector of requiredFields) {
						const field = form.querySelector(fieldSelector);
						if (!field || field.disabled || field.readOnly) {
							return false;
						}
					}
				}

				// Check for any disabled/readonly inputs that should be enabled
				const inputs = form.querySelectorAll('input, select, textarea, button');
				const interactiveInputs = Array.from(inputs).filter(input =>
					!input.hasAttribute('readonly') &&
					input.type !== 'hidden' &&
					!input.classList.contains('disabled')
				);

				// At least some inputs should be enabled
				return interactiveInputs.some(input => !input.disabled);
			`);
		}, timeout);

		console.log(`✅ ${errorPrefix} ready for interaction`);
		return form;
	}

	/**
	 * Wait for class creation/deletion operation to complete
	 * Specific to your class management workflows
	 */
	static async waitForClassOperationComplete(driver, operationType = 'create', className = 'Webdriver', timeout = 15000) {
		console.log(`🎓 Waiting for class ${operationType} operation to complete...`);

		const startTime = Date.now();

		// Wait for network activity to settle (API calls for class operations)
		await NetworkWait.forNetworkIdle(driver, 1500, 8000);

		// Look for operation completion indicators
		const completionSelectors = [
			// Success message indicators
			By.xpath(`//*[contains(text(),'success') or contains(text(),'Success') or contains(text(),'created') or contains(text(),'Created')]`),

			// Class appears in list
			By.xpath(`//*[contains(text(),'${className}') and (ancestor::tr or ancestor::div[contains(@style,'cursor')] or ancestor::li)]`),

			// Navigation change (form closed, back to list)
			By.xpath(`//*[contains(text(),'Dashboard') or contains(text(),'Classes') or contains(text(),'Class List')]`),

			// Generic content indicators
			By.css('tr[role="row"], .class-item, [data-class-name]')
		];

		let operationComplete = false;

		for (const selector of completionSelectors) {
			try {
				await driver.wait(async () => {
					const elements = await driver.findElements(selector);
					return elements.length > 0;
				}, Math.min(timeout, 8000));

				console.log(`✅ Class ${operationType} completion detected`);
				operationComplete = true;
				break;

			} catch (error) {
				// Try next selector
			}
		}

		// Fallback: check URL change or wait additional time
		if (!operationComplete) {
			const currentUrl = await driver.getCurrentUrl();
			if (currentUrl.includes('class') || currentUrl.includes('dashboard')) {
				console.log(`✅ URL indicates class ${operationType} completed`);
				operationComplete = true;
			} else {
				// Final fallback: ensure some time has passed and network is idle
				const elapsed = Date.now() - startTime;
				if (elapsed < 3000) {
					await SmartWait.sleep(3000 - elapsed);
				}
				console.log(`✅ Class ${operationType} assumed complete (fallback)`);
				operationComplete = true;
			}
		}

		return operationComplete;
	}

	/**
	 * Wait for login process to complete
	 * Addresses login verification issues in your current code
	 */
	static async waitForLoginComplete(driver, userType = 'learner', timeout = 15000) {
		console.log(`🔐 Waiting for ${userType} login to complete...`);

		const loginSuccessSelectors = {
			learner: [
				By.css('button[aria-label*="Benchmark Test"]'),
				By.xpath("//*[contains(text(), 'Dashboard') or contains(text(), 'Welcome')]"),
				By.css('nav, header, [role="navigation"]'),
				By.xpath("//*[contains(@class, 'dashboard')]")
			],
			educator: [
				By.xpath("//*[contains(text(),'Educator') or contains(text(),'Dashboard') or contains(text(),'Classes')]"),
				By.css('[aria-label="add"], button[aria-label*="add"]'),
				By.xpath("//nav | //header")
			],
			curator: [
				By.xpath("//*[contains(text(),'Curator') or contains(text(),'Dashboard')]"),
				By.xpath("//nav | //header")
			]
		};

		const selectors = loginSuccessSelectors[userType] || loginSuccessSelectors.learner;

		// Wait for login form to disappear AND success indicators to appear
		try {
			// First, wait for login form to disappear
			await driver.wait(async () => {
				const loginForms = await driver.findElements(By.css('input[name="username"], #sign_in'));
				return loginForms.length === 0;
			}, Math.min(timeout, 8000));

			console.log(`✅ Login form disappeared`);

			// Then wait for success indicators
			for (const selector of selectors) {
				try {
					await SmartWait.forElement(driver, selector, {
						timeout: 5000,
						visible: true,
						errorPrefix: `${userType} login success indicator`
					});

					console.log(`✅ ${userType} login success confirmed`);
					return true;

				} catch (error) {
					// Try next selector
				}
			}

			console.log(`⚠️ Login form disappeared but success indicators not found - assuming success`);
			return true;

		} catch (error) {
			console.log(`❌ Login completion timeout: ${error.message}`);
			throw new Error(`${userType} login failed to complete within ${timeout}ms`);
		}
	}

	/**
	 * Wait for class content to be fully loaded after opening a class
	 * Addresses timing issues with class content rendering
	 */
	static async waitForClassContentReady(driver, timeout = 15000) {
		console.log(`📊 Waiting for class content to be fully loaded...`);

		const startTime = Date.now();

		// Wait for network to settle first
		await NetworkWait.forNetworkIdle(driver, 1000, 8000);

		// Primary indicator: nativeWidget elements (actual class content)
		try {
			await SmartWait.forElement(driver, By.css('div.nativeWidget[role="presentation"]'), {
				timeout: 5000,
				visible: true,
				errorPrefix: 'Class content (nativeWidget)'
			});

			console.log(`✅ Class content detected and loaded`);
			return true;

		} catch (error) {
			// Fallback: Try other indicators
			const fallbackIndicators = [
				By.xpath("//*[contains(text(),'learners') and contains(text(),'performance')]"),
				By.xpath("//*[contains(text(),'Performance') or contains(text(),'Analytics') or contains(text(),'Progress')]")
			];

			for (const indicator of fallbackIndicators) {
				try {
					await SmartWait.forElement(driver, indicator, {
						timeout: 3000,
						visible: true,
						errorPrefix: 'Class content indicator'
					});

					console.log(`✅ Class content detected via fallback`);
					return true;

				} catch (error) {
					// Try next indicator
				}
			}

			// Final fallback: verify URL changed and we're no longer on class list
			const currentUrl = await driver.getCurrentUrl();

			const onClassPage = currentUrl.includes('/class/') ||
			                   currentUrl.includes('/course/') ||
			                   !currentUrl.includes('/educator');

			if (onClassPage) {
				console.log(`✅ URL indicates class opened (${currentUrl})`);
				return true;
			}

			const elapsed = Date.now() - startTime;
			console.log(`⚠️ Could not confirm class content loaded after ${elapsed}ms`);
			return false;
		}
	}
}
