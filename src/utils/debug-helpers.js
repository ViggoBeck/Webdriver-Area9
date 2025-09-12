// Debug helpers for visual testing

export async function pauseForObservation(driver, message = "Pausing for observation", seconds = 3) {
	if (process.argv.includes('--visible') || process.argv.includes('-v')) {
		console.log(`👁️ ${message} (${seconds}s)...`);
		await new Promise(resolve => setTimeout(resolve, seconds * 1000));
	}
}

export async function logCurrentState(driver, testName) {
	if (process.argv.includes('--visible') || process.argv.includes('-v')) {
		try {
			const url = await driver.getCurrentUrl();
			const title = await driver.getTitle();
			console.log(`📍 ${testName}: ${title} - ${url}`);
		} catch (e) {
			console.log(`📍 ${testName}: Could not get page info`);
		}
	}
}