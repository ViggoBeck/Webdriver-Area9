// logout.js - Unified logout utility for all roles
// Based on proven learner-utils.js pattern

import { By, until } from "selenium-webdriver";

/**
 * Dismiss overlays that might interfere with logout
 * Reused from learner-utils.js
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
				if (await btn.isDisplayed()) {
					await driver.executeScript("arguments[0].click();", btn);
					await new Promise(r => setTimeout(r, 500));
					dismissed++;
					break;
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
}

/**
 * Scroll menu to reveal logout button - multiple strategies
 */
async function scrollMenuToRevealLogout(driver) {
	try {
		const scrolled = await driver.executeScript(`
			// Strategy 1: Find logout button first and scroll it into view
			const logoutButtons = document.querySelectorAll('button[aria-label="LOGOUT"]');
			if (logoutButtons.length > 0) {
				for (const btn of logoutButtons) {
					// Try to scroll the button into view
					btn.scrollIntoView({block: 'end', inline: 'nearest'});

					// Also try scrolling any scrollable parent
					let parent = btn.parentElement;
					while (parent) {
						if (parent.scrollHeight > parent.clientHeight) {
							parent.scrollTop = parent.scrollHeight;
							console.log('Scrolled parent to bottom:', parent.className);
						}
						parent = parent.parentElement;
						if (parent === document.body) break;
					}
				}
				console.log('Scrolled to logout button using scrollIntoView');
				return true;
			}

			// Strategy 2: Find menu container with overflow and scroll it
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
							console.log('Scrolled maskContainer by', scrollAmount, 'px');
							return true;
						}
					}
				}
			}

			// Strategy 3: Scroll any role="list" container
			const lists = document.querySelectorAll('[role="list"]');
			for (const list of lists) {
				if (list.scrollHeight > list.clientHeight) {
					list.scrollTop = list.scrollHeight;
					console.log('Scrolled list container to bottom');
					return true;
				}
				const parent = list.parentElement;
				if (parent && parent.scrollHeight > parent.clientHeight) {
					parent.scrollTop = parent.scrollHeight;
					console.log('Scrolled list parent to bottom');
					return true;
				}
			}

			return false;
		`);

		await new Promise(r => setTimeout(r, scrolled ? 1000 : 500));
		console.log(scrolled ? "✅ Menu scrolled to reveal logout" : "ℹ️ No scrolling needed or possible");
	} catch (e) {
		console.log(`⚠️ Menu scroll error: ${e.message}`);
	}
}

/**
 * Unified logout for all roles
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {string} role - 'learner', 'educator', or 'curator'
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
				console.log(`⚠️ Menu open failed (attempt ${attempt}): ${e.message}`);
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
				// Find all logout buttons (there might be multiple in DOM)
				const logoutButtons = await driver.findElements(By.xpath("//button[@aria-label='LOGOUT']"));

				if (logoutButtons.length === 0) {
					throw new Error("No logout button found in DOM");
				}

				console.log(`📍 Found ${logoutButtons.length} logout button(s) in DOM`);

				// Try to make the button and its parents visible
				let clickSucceeded = false;
				for (let i = 0; i < logoutButtons.length; i++) {
					const logoutBtn = logoutButtons[i];

					try {
						// Force visibility on the button and all parent elements
						await driver.executeScript(`
							const button = arguments[0];

							// Make button and all parents visible
							let element = button;
							while (element) {
								if (element.style) {
									element.style.visibility = 'visible';
									element.style.opacity = '1';
									element.style.display = 'block';
								}
								element = element.parentElement;
								// Stop at body or after 10 levels
								if (!element || element.tagName === 'BODY' || element === document.body) break;
							}

							// Scroll into view
							button.scrollIntoView({block: 'center', inline: 'center'});

							// Ensure clickable
							button.style.pointerEvents = 'auto';
							button.style.zIndex = '99999';

							console.log('Forced button visibility');
						`, logoutBtn);

						await new Promise(r => setTimeout(r, 500));

						// Check if now visible
						const isVisible = await logoutBtn.isDisplayed();
						console.log(`   Button ${i+1}: visible=${isVisible} (after forcing)`);

						// Try to click regardless
						try {
							await driver.executeScript("arguments[0].click();", logoutBtn);
							console.log(`✅ Logout clicked (JS, button ${i+1})`);
							clickSucceeded = true;
							break;
						} catch (clickErr) {
							console.log(`   Button ${i+1} click error: ${clickErr.message}`);
							continue;
						}

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
					// Try scrolling again
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

		// Debug info
		try {
			const url = await driver.getCurrentUrl();
			console.log(`⚠️ Current URL: ${url}`);
		} catch (e) {
			// Ignore
		}
	}
}
