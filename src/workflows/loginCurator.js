// loginCurator.js - Using Smart Wait Utilities & Unified Auth
// Eliminates timing dependencies, race conditions, and the need for --slow mode

import { getAccountForTest, DEFAULT_PASSWORD } from "../utils/accounts.js";
import { performLogout } from "../utils/auth.js";
import { waitFor, selectorsFor } from "../utils/driver.js";

export async function loginCurator(driver) {
	await driver.get("https://br.uat.sg.rhapsode.com/curator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");

	const assignedAccount = getAccountForTest("Login Curator");

	// Wait for username field
	const emailField = await waitFor.element(driver, selectorsFor.area9.usernameField(), {
		timeout: 15000,
		visible: true,
		errorPrefix: 'Username field'
	});
	await emailField.sendKeys(assignedAccount);

	// Wait for password field
	const passwordField = await waitFor.element(driver, selectorsFor.area9.passwordField(), {
		visible: true,
		errorPrefix: 'Password field'
	});
	await passwordField.sendKeys(DEFAULT_PASSWORD);

	// Wait for sign in button
	const signInButton = await waitFor.element(driver, selectorsFor.area9.signInButton(), {
		clickable: true,
		errorPrefix: 'Sign in button'
	});

	// START TIMING: Right before clicking login
	const start = Date.now();
	await waitFor.smartClick(driver, signInButton);

	// Wait for login to complete (dashboard appears)
	await waitFor.loginComplete(driver, 'curator', 20000);

	// Wait for network to settle (page fully interactive) - part of measurement
	await waitFor.networkIdle(driver, 1000, 5000);

	// STOP TIMER - page is now fully interactive
	const end = Date.now();
	const seconds = (end - start) / 1000;
	console.log("⏱ Login Curator tog:", seconds, "sekunder");

	// --- LOGOUT (now using unified auth) ---
	await performLogout(driver, 'curator');

	return seconds;
}
