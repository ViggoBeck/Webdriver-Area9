import { createDriver } from "./utils/driver.js";
import { debugPageElements, waitForPageLoad } from "./utils/debug.js";

async function debugCommunicatorEducator() {
	const driver = await createDriver();

	try {
		console.log("🔍 Debugging Communicator Educator specific issue...");

		const url = "https://br.uat.sg.rhapsode.com/educator.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc#communication";
		console.log(`🔗 URL: ${url}`);

		await driver.get(url);
		await waitForPageLoad(driver, 10000);

		// Wait a bit longer for any dynamic content
		console.log("⏳ Waiting for page to fully load...");
		await new Promise(resolve => setTimeout(resolve, 5000));

		await debugPageElements(driver, "Communicator Educator");

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await driver.quit();
	}
}

debugCommunicatorEducator();