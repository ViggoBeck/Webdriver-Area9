import { By } from "selenium-webdriver";
import { createDriver } from "./utils/driver.js";

async function debugLoginButton() {
	const driver = await createDriver();

	try {
		console.log("🔍 Finding EXACT login button selectors...\n");

		await driver.get("https://br.uat.sg.rhapsode.com/learner.html?s=YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc");
		await new Promise(resolve => setTimeout(resolve, 3000));

		// Get ALL button elements
		const buttons = await driver.findElements(By.css("button"));
		console.log(`🔘 Found ${buttons.length} button elements:`);

		for (let i = 0; i < buttons.length; i++) {
			try {
				const id = await buttons[i].getAttribute("id");
				const className = await buttons[i].getAttribute("class");
				const type = await buttons[i].getAttribute("type");
				const text = await buttons[i].getText();
				const tagName = await buttons[i].getTagName();

				console.log(`\nButton ${i + 1}:`);
				console.log(`  Tag: <${tagName}>`);
				console.log(`  ID: "${id || 'none'}"`);
				console.log(`  Class: "${className || 'none'}"`);
				console.log(`  Type: "${type || 'none'}"`);
				console.log(`  Text: "${text || 'none'}"`);
				console.log(`  Selector: ${id ? `#${id}` : 'No ID'}`);
			} catch (e) {
				console.log(`Button ${i + 1}: Error reading attributes`);
			}
		}

		// Get ALL input elements (in case it's an input, not button)
		const inputs = await driver.findElements(By.css("input"));
		console.log(`\n📝 Found ${inputs.length} input elements:`);

		for (let i = 0; i < inputs.length; i++) {
			try {
				const id = await inputs[i].getAttribute("id");
				const className = await inputs[i].getAttribute("class");
				const type = await inputs[i].getAttribute("type");
				const value = await inputs[i].getAttribute("value");
				const name = await inputs[i].getAttribute("name");

				console.log(`\nInput ${i + 1}:`);
				console.log(`  ID: "${id || 'none'}"`);
				console.log(`  Class: "${className || 'none'}"`);
				console.log(`  Type: "${type || 'none'}"`);
				console.log(`  Name: "${name || 'none'}"`);
				console.log(`  Value: "${value || 'none'}"`);
				console.log(`  Selector: ${id ? `#${id}` : 'No ID'}`);
			} catch (e) {
				console.log(`Input ${i + 1}: Error reading attributes`);
			}
		}

		// Get page HTML around form area to see the actual structure
		console.log("\n📄 Form HTML structure:");
		try {
			const formElement = await driver.findElement(By.css("form"));
			const formHTML = await driver.executeScript("return arguments[0].outerHTML;", formElement);
			console.log(formHTML);
		} catch (e) {
			console.log("Could not find form element");
		}

	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await driver.quit();
	}
}

console.log("🔧 Login Button Selector Detective\n");
debugLoginButton();