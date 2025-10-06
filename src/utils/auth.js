// auth.js - Unified authentication utilities for all roles
// Consolidates login/logout logic with smart waits

import { By, until } from "selenium-webdriver";
import { waitFor, selectorsFor } from "./driver.js";
import { DEFAULT_PASSWORD } from "./accounts.js";

/**
 * Dismiss overlays that might interfere with login/logout
 */
async function dismissOverlays(driver) {
	let dismissed = 0;

	const selectors = [
		By.xpath("//*[normalize-space(text())='GOT IT']"),
		By.xpath("//*[normalize-space(text())='Got it']"),
		By.xpath("//*[normalize-space(text())='OK']"),
		By.xpath("//*[normalize-space(text())='Close']"),
		By.xpath("//*[normalize-space(text())='Skip']"),
		By.css("button[aria-label*='close']"),
		By.css("button[aria-label*='dismiss']")
	];

	for (const selector of selectors) {
		try {
			const buttons = await driver.findElements(selector);
			for (let btn of buttons) {
				try {
					if (await btn.isDisplayed()) {
						await driver.executeScript("arguments[0].click();", btn);
						await new Promise(r => setTimeout(r, 500));
						dismissed++;
						break;
					}
				} catch (e) {
					// Element might have gone stale, continue
				}
			}
		} catch (e) {
			// Continue to next selector
		}
	}

	if (dismissed > 0) {
		console.log(`✅ Dismissed ${dismissed} overlay(s)`);
		await new Promise(r => setTimeout(r, 1000));
	}

	return dismissed;
}

/**
 * Scroll menu to reveal logout button
 */
async function scrollMenuToRevealLogout(driver) {
	try {
		const scrolled = await driver.executeScript(`
			// Strategy 1: Find logout button and scroll it into view
			const logoutButtons = document.querySelectorAll('button[aria-label="LOGOUT"]');
			if (logoutButtons.length > 0) {
				for (const btn of logoutButtons) {
					btn.scrollIntoView({block: 'end', inline: 'nearest'});
					let parent = btn.parentElement;
					while (parent) {
						if (parent.scrollHeight > parent.clientHeight) {
							parent.scrollTop = parent.scrollHeight;
						}
						parent = parent.parentElement;
						if (parent === document.body) break;
					}
				}
				return true;
			}

			// Strategy 2: Find menu container and scroll it
			const containers = document.querySelectorAll('.nativeWidget');
			for (const container of containers) {
				const style = window.getComputedStyle(container);
				if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
					const maskContainer = container.querySelector('.maskContainer');
					if (maskContainer) {
						const containerHeight = container.offsetHeight;
						const contentHeight = maskContainer.offsetHeight;
						if (contentHeight > containerHeight) {
							const scrollAmount = contentHeight - containerHeight;
							maskContainer.style.transform = 'translateY(-' + scrollAmount + 'px)';
							return true;
						}
					}
				}
			}

			return false;
		`);

		await new Promise(r => setTimeout(r, scrolled ? 1000 : 500));
		if (scrolled) {
			console.log("✅ Menu scrolled to reveal logout");
		}
	} catch (e) {
		console.log(`⚠️ Menu scroll error: ${e.message}`);
	}
}

/**
 * Unified login for all roles
 *
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} role - 'learner', 'educator', or 'curator'
 * @param {string} account - Email address for login
 * @param {string} password - Password (defaults to DEFAULT_PASSWORD)
 * @returns {Promise<void>}
 */
export async function performLogin(driver, role, account, password = DEFAULT_PASSWORD) {
	console.log(`🔐 Logging in as ${role}: ${account}`);

	// Wait for and fill username field
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(account);

	// Wait for and fill password field
	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(password);

	// Wait for and click sign in button
	const signInButton = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	await waitFor.smartClick(driver, signInButton);

	// Wait for login to complete
	await waitFor.loginComplete(driver, role, 20000);
	console.log(`✅ Logged in as ${role}`);

	// Dismiss any overlays
	await dismissOverlays(driver);

	// Wait for page to stabilize
	await waitFor.networkIdle(driver, 1000, 5000);
}

/**
 * Unified logout for all roles
 *
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} role - 'learner', 'educator', or 'curator' (affects timing)
 * @returns {Promise<void>}
 */
export async function performLogout(driver, role = 'learner') {
	console.log(`🔄 Starting ${role} logout...`);

	try {
		// Dismiss any overlays first
		await dismissOverlays(driver);

		// Step 1: Open menu (retry × 3)
		let menuOpened = false;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const menuBtn = await driver.wait(
					until.elementLocated(By.xpath("//button[@aria-label='Show Menu']")),
					5000
				);
				await driver.wait(until.elementIsVisible(menuBtn), 2000);

				// Ensure button is in view and clickable
				await driver.executeScript(`
					arguments[0].scrollIntoView({block: 'center'});
					arguments[0].style.zIndex = '9999';
				`, menuBtn);

				await driver.executeScript("arguments[0].click();", menuBtn);
				console.log("✅ Menu opened");
				menuOpened = true;
				break;
			} catch (e) {
				console.log(`⚠️ Menu open attempt ${attempt} failed: ${e.message}`);
				if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
			}
		}

		if (!menuOpened) {
			throw new Error("Could not open menu");
		}

		// Wait for menu animation - curator needs more time
		const menuDelay = role === 'curator' ? 2000 : 1000;
		await new Promise(r => setTimeout(r, menuDelay));

		// Scroll menu to reveal logout button
		await scrollMenuToRevealLogout(driver);

		// Step 2: Click logout (retry × 3)
		let logoutClicked = false;
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const logoutButtons = await driver.findElements(By.xpath("//button[@aria-label='LOGOUT']"));

				if (logoutButtons.length === 0) {
					throw new Error("No logout button found in DOM");
				}

				console.log(`📍 Found ${logoutButtons.length} logout button(s)`);

				// Try each button until one works
				let clickSucceeded = false;
				for (let i = 0; i < logoutButtons.length; i++) {
					const logoutBtn = logoutButtons[i];

					try {
						// Force visibility on button and parents
						await driver.executeScript(`
							const button = arguments[0];
							let element = button;
							while (element) {
								if (element.style) {
									element.style.visibility = 'visible';
									element.style.opacity = '1';
									element.style.display = 'block';
								}
								element = element.parentElement;
								if (!element || element.tagName === 'BODY' || element === document.body) break;
							}
							button.scrollIntoView({block: 'center', inline: 'center'});
							button.style.pointerEvents = 'auto';
							button.style.zIndex = '99999';
						`, logoutBtn);

						await new Promise(r => setTimeout(r, 500));

						// Try to click
						await driver.executeScript("arguments[0].click();", logoutBtn);
						console.log(`✅ Logout clicked (button ${i+1})`);
						clickSucceeded = true;
						break;
					} catch (btnErr) {
						console.log(`   Button ${i+1} failed: ${btnErr.message}`);
						continue;
					}
				}

				if (clickSucceeded) {
					logoutClicked = true;
					break;
				} else {
					throw new Error("All logout buttons failed to click");
				}

			} catch (e) {
				console.log(`⚠️ Logout click attempt ${attempt} failed: ${e.message}`);
				if (attempt < 3) {
					await scrollMenuToRevealLogout(driver);
					await new Promise(r => setTimeout(r, 1000));
				}
			}
		}

		if (!logoutClicked) {
			throw new Error("Could not click logout after all attempts");
		}

		// Step 3: Verify logout
		try {
			await driver.wait(until.elementLocated(By.css('input[name="username"]')), 8000);
			console.log("✅ Logout successful - login form visible");
		} catch {
			const url = await driver.getCurrentUrl();
			if (url.includes("login") || url.includes("signin")) {
				console.log("✅ Logout successful - redirected to login");
			} else {
				console.log("⚠️ Logout completed but not verified");
			}
		}

		// Wait for logout to fully process
		await new Promise(r => setTimeout(r, 2000));

	} catch (error) {
		console.log(`⚠️ Logout failed: ${error.message}`);
		console.log("⚠️ Non-critical - test will continue");
	}
}

/**
 * Export dismissOverlays for use in workflows that need it separately
 */
export { dismissOverlays };
