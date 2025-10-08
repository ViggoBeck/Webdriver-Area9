// pageLoad.js - Enhanced resource-aware page load measurement
// Measures complete page load including all CSS, JS, fonts, images, and XHR requests

import { pauseForObservation, logCurrentState } from "../utils/debug-helpers.js";
import { logger } from "../utils/logger.js";
import { waitFor } from "../utils/driver.js";
import { buildLearnerUrl } from "../utils/config.js";

export async function pageLoad(driver) {
	logger.info("🚀 Starting Page Load test (cold measurement)...");
	logger.info("🎯 Measuring complete page load including all resources...");
	logger.info("🚀 Starting page load timer...");

	const startTime = Date.now();

	// Navigate to page
	await driver.get(buildLearnerUrl());

	// Wait for initial page load event
	await driver.executeScript(`
		return new Promise(resolve => {
			if (document.readyState === 'complete') {
				resolve();
			} else {
				window.addEventListener('load', resolve);
			}
		});
	`);

	// Wait for network idle (catches XHR/fetch requests)
	await waitFor.networkIdle(driver, 1500, 10000);

	// Get comprehensive resource loading metrics
	const metrics = await driver.executeScript(`
		const entries = performance.getEntriesByType('resource');
		const navigation = performance.getEntriesByType('navigation')[0];

		const resourceSummary = {
			total: entries.length,
			byType: {},
			totalTransferSize: 0,
			largestDuration: 0
		};

		entries.forEach(entry => {
			const type = entry.initiatorType;
			if (!resourceSummary.byType[type]) {
				resourceSummary.byType[type] = { count: 0, size: 0, duration: 0 };
			}
			resourceSummary.byType[type].count++;
			resourceSummary.byType[type].size += entry.transferSize || 0;
			resourceSummary.byType[type].duration += entry.duration;

			resourceSummary.totalTransferSize += entry.transferSize || 0;
			resourceSummary.largestDuration = Math.max(resourceSummary.largestDuration, entry.duration);
		});

		return {
			resources: resourceSummary,
			navigation: navigation ? {
				domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
				loadComplete: navigation.loadEventEnd - navigation.fetchStart,
				domInteractive: navigation.domInteractive - navigation.fetchStart
			} : null,
			paint: {
				fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
				lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
			}
		};
	`);

	const totalElapsed = (Date.now() - startTime) / 1000;

	// Display detailed metrics
	logger.info(`\n📊 Page Load Metrics:`);
	logger.info(`⏱ Total Time: ${totalElapsed.toFixed(3)}s`);

	if (metrics.navigation) {
		logger.info(`  📄 DOM Content Loaded: ${(metrics.navigation.domContentLoaded / 1000).toFixed(3)}s`);
		logger.info(`  🎯 Load Event Complete: ${(metrics.navigation.loadComplete / 1000).toFixed(3)}s`);
		logger.info(`  ⚡ DOM Interactive: ${(metrics.navigation.domInteractive / 1000).toFixed(3)}s`);
	}

	if (metrics.paint.fcp > 0) {
		logger.info(`  🎨 First Contentful Paint: ${(metrics.paint.fcp / 1000).toFixed(3)}s`);
	}

	logger.info(`\n📦 Resources Loaded (${metrics.resources.total} total):`);
	Object.entries(metrics.resources.byType).forEach(([type, stats]) => {
		const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
		const avgDuration = (stats.duration / stats.count).toFixed(0);
		logger.info(`  ${type}: ${stats.count} files, ${sizeMB}MB, avg ${avgDuration}ms`);
	});

	logger.info(`\n💾 Total Transfer Size: ${(metrics.resources.totalTransferSize / 1024 / 1024).toFixed(2)}MB`);

	await logCurrentState(driver, "Page Load");
	await pauseForObservation(driver, "Page load completed", 3);

	logger.info("\n✨ Page Load test finished");

	// Return total elapsed time as the metric
	return Number(totalElapsed.toFixed(3));
}
