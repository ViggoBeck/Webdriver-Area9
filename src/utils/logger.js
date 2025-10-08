// Centralized logging utility with configurable log levels
import { LOG_LEVEL, LOG_LEVELS } from './config.js';

const currentLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

export const logger = {
	// Always logs, regardless of level
	always: (message, ...args) => {
		console.log(message, ...args);
	},

	// Error messages (level 1)
	error: (message, ...args) => {
		if (currentLevel >= LOG_LEVELS.error) {
			console.log(message, ...args);
		}
	},

	// Warning messages (level 2)
	warn: (message, ...args) => {
		if (currentLevel >= LOG_LEVELS.warn) {
			console.log(message, ...args);
		}
	},

	// Info messages - important workflow status (level 3)
	info: (message, ...args) => {
		if (currentLevel >= LOG_LEVELS.info) {
			console.log(message, ...args);
		}
	},

	// Debug messages - detailed status (level 4)
	debug: (message, ...args) => {
		if (currentLevel >= LOG_LEVELS.debug) {
			console.log(message, ...args);
		}
	},

	// Verbose messages - everything (level 5)
	verbose: (message, ...args) => {
		if (currentLevel >= LOG_LEVELS.verbose) {
			console.log(message, ...args);
		}
	}
};
