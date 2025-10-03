// Network-Aware Waiting - Detect when application network activity is complete
import { SmartWait } from './smart-wait.js';

export class NetworkWait {
	/**
	 * Wait for network idle state - no active requests for specified duration
	 * Solves race conditions where page appears loaded but AJAX calls are still running
	 */
	static async forNetworkIdle(driver, idleTime = 2000, timeout = 15000) {
		const startTime = Date.now();

		try {
			console.log(`🌐 Monitoring network activity for ${idleTime}ms idle period...`);

			const result = await driver.executeAsyncScript(`
				const callback = arguments[arguments.length - 1];
				const idleTime = ${idleTime};
				const timeoutMs = ${timeout};
				const startTime = Date.now();

				let activeRequests = 0;
				let lastActivity = Date.now();
				let requestHistory = [];

				// Track fetch requests
				const originalFetch = window.fetch;
				window.fetch = function(...args) {
					activeRequests++;
					lastActivity = Date.now();
					requestHistory.push({type: 'fetch', url: args[0], time: Date.now()});

					return originalFetch.apply(this, args).finally(() => {
						activeRequests--;
						lastActivity = Date.now();
					});
				};

				// Track XMLHttpRequest
				const originalXHROpen = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(...args) {
					const xhr = this;
					activeRequests++;
					lastActivity = Date.now();
					requestHistory.push({type: 'xhr', url: args[1], time: Date.now()});

					xhr.addEventListener('loadend', () => {
						activeRequests--;
						lastActivity = Date.now();
					});

					return originalXHROpen.apply(this, args);
				};

				// Monitor for idle state
				const checkIdle = () => {
					const now = Date.now();
					const timeSinceLastActivity = now - lastActivity;
					const totalElapsed = now - startTime;

					if (activeRequests === 0 && timeSinceLastActivity >= idleTime) {
						callback({
							success: true,
							idle: true,
							activeRequests: 0,
							idleDuration: timeSinceLastActivity,
							totalTime: totalElapsed,
							requestHistory: requestHistory.slice(-10) // Last 10 requests
						});
					} else if (totalElapsed >= timeoutMs) {
						callback({
							success: false,
							timeout: true,
							activeRequests: activeRequests,
							timeSinceLastActivity: timeSinceLastActivity,
							totalTime: totalElapsed,
							requestHistory: requestHistory.slice(-10)
						});
					} else {
						setTimeout(checkIdle, 100);
					}
				};

				// Start monitoring after a brief delay to catch immediate requests
				setTimeout(checkIdle, 100);
			`);

			const elapsed = Date.now() - startTime;

			if (result.success) {
				console.log(`✅ Network idle achieved after ${elapsed}ms (${result.activeRequests} active, ${result.idleDuration}ms idle)`);
				if (result.requestHistory.length > 0) {
					console.log(`📊 Recent requests:`, result.requestHistory.map(r => `${r.type}:${r.url}`));
				}
				return true;
			} else {
				console.log(`⚠️ Network idle timeout after ${elapsed}ms (${result.activeRequests} still active)`);
				if (result.requestHistory.length > 0) {
					console.log(`📊 Recent requests:`, result.requestHistory.map(r => `${r.type}:${r.url}`));
				}
				return false;
			}

		} catch (error) {
			console.log(`❌ Network monitoring error: ${error.message}`);
			// Fallback to simple time-based wait
			await SmartWait.sleep(idleTime);
			return true;
		}
	}

	/**
	 * Wait for specific network requests to complete
	 * Useful for known API endpoints that must finish before test proceeds
	 */
	static async forSpecificRequests(driver, urlPatterns, timeout = 10000) {
		const startTime = Date.now();

		try {
			console.log(`🎯 Waiting for specific requests: ${urlPatterns.join(', ')}`);

			const result = await driver.executeAsyncScript(`
				const callback = arguments[arguments.length - 1];
				const patterns = ${JSON.stringify(urlPatterns)};
				const timeoutMs = ${timeout};
				const startTime = Date.now();

				let completedPatterns = new Set();
				let pendingRequests = new Map();

				const checkPattern = (url) => {
					return patterns.find(pattern => url.includes(pattern));
				};

				// Track fetch requests
				const originalFetch = window.fetch;
				window.fetch = function(...args) {
					const url = args[0];
					const pattern = checkPattern(url);

					if (pattern) {
						const requestId = Date.now() + Math.random();
						pendingRequests.set(requestId, {pattern, url, type: 'fetch'});

						return originalFetch.apply(this, args).finally(() => {
							pendingRequests.delete(requestId);
							completedPatterns.add(pattern);
						});
					}

					return originalFetch.apply(this, args);
				};

				// Track XMLHttpRequest
				const originalXHROpen = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(...args) {
					const xhr = this;
					const url = args[1];
					const pattern = checkPattern(url);

					if (pattern) {
						const requestId = Date.now() + Math.random();
						pendingRequests.set(requestId, {pattern, url, type: 'xhr'});

						xhr.addEventListener('loadend', () => {
							pendingRequests.delete(requestId);
							completedPatterns.add(pattern);
						});
					}

					return originalXHROpen.apply(this, args);
				};

				// Check completion
				const checkCompletion = () => {
					const now = Date.now();
					const elapsed = now - startTime;

					if (completedPatterns.size >= patterns.length && pendingRequests.size === 0) {
						callback({
							success: true,
							completedPatterns: Array.from(completedPatterns),
							totalTime: elapsed
						});
					} else if (elapsed >= timeoutMs) {
						callback({
							success: false,
							timeout: true,
							completedPatterns: Array.from(completedPatterns),
							pendingRequests: Array.from(pendingRequests.values()),
							totalTime: elapsed
						});
					} else {
						setTimeout(checkCompletion, 200);
					}
				};

				setTimeout(checkCompletion, 100);
			`);

			const elapsed = Date.now() - startTime;

			if (result.success) {
				console.log(`✅ All target requests completed after ${elapsed}ms`);
				return true;
			} else {
				console.log(`⚠️ Request timeout after ${elapsed}ms - completed: ${result.completedPatterns.length}/${urlPatterns.length}`);
				return false;
			}

		} catch (error) {
			console.log(`❌ Request monitoring error: ${error.message}`);
			return false;
		}
	}

	/**
	 * Enhanced page load detection - waits for DOM + network + resources
	 * Replaces basic page navigation waiting
	 */
	static async forCompletePageLoad(driver, options = {}) {
		const {
			networkIdleTime = 1500,
			resourceTimeout = 10000,
			skipImages = true
		} = options;

		console.log(`🔄 Waiting for complete page load...`);

		// Wait for basic DOM ready
		await driver.executeScript(`
			return new Promise(resolve => {
				if (document.readyState === 'complete') {
					resolve();
				} else {
					window.addEventListener('load', resolve);
				}
			});
		`);

		// Wait for network idle
		const networkIdle = await this.forNetworkIdle(driver, networkIdleTime);

		// Optionally wait for images and other resources
		if (!skipImages) {
			await this.waitForResources(driver, resourceTimeout);
		}

		return networkIdle;
	}

	/**
	 * Wait for images and other resources to load
	 */
	static async waitForResources(driver, timeout = 10000) {
		try {
			await driver.wait(async () => {
				return await driver.executeScript(`
					const images = Array.from(document.images);
					return images.every(img => img.complete || img.naturalWidth > 0);
				`);
			}, timeout);

			console.log(`✅ All page resources loaded`);
		} catch (error) {
			console.log(`⚠️ Resource loading timeout: ${error.message}`);
		}
	}
}