// loginEducator.js - Using Smart Wait Utilities
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { waitFor, selectorsFor } from "../utils/driver.js";
import { performLogout } from "../utils/logout.js";

export async function loginEducator(driver) {
	await driver.get("https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	// Wait for username field with smart waiting - no more hardcoded 4s delay
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});

	const assignedAccount = getAccountForTest("Login Educator");
	await emailField.sendKeys(assignedAccount);

	// Wait for password field
	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Wait for sign in button to be clickable
	const signInButton = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// START TIMING: Right before clicking login
	const start = Date.now();
	await waitFor.smartClick(driver, signInButton);

	// Wait for login to complete (dashboard appears)
	await waitFor.loginComplete(driver, 'educator', 20000);

	// Wait for network to settle (page fully interactive) - part of measurement
	await waitFor.networkIdle(driver, 1000, 5000);

	// STOP TIMER - page is now fully interactive
	const end = Date.now();
	const seconds = (end - start) / 1000;
	console.log("⏱ Login Educator tog:", seconds, "sekunder");

	// --- LOGOUT ---
	await performLogout(driver, 'educator');

	return seconds;
}
