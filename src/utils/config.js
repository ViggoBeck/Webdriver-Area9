// Configuration utilities - loads from environment variables
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables with defaults
export const BASE_URL = process.env.BASE_URL || "https://br.uat.sg.rhapsode.com";
export const SKIN_PARAM = process.env.SKIN_PARAM || "YZUVwMzYfBDNyEzXnlWcYZUVwMzYnlWc";
export const DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT) || 20000;
export const BUTTON_LOAD_THRESHOLD = parseInt(process.env.BUTTON_LOAD_THRESHOLD) || 20;

// Log level configuration
// Available levels: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose'
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Log level hierarchy
export const LOG_LEVELS = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
	verbose: 5
};

// URL builders for different roles
export function buildLearnerUrl(hash = "") {
	const url = `${BASE_URL}/learner.html?s=${SKIN_PARAM}`;
	return hash ? `${url}#${hash}` : url;
}

export function buildEducatorUrl(hash = "") {
	const url = `${BASE_URL}/educator.html?s=${SKIN_PARAM}`;
	return hash ? `${url}#${hash}` : url;
}

export function buildCuratorUrl(hash = "") {
	const url = `${BASE_URL}/curator.html?s=${SKIN_PARAM}`;
	return hash ? `${url}#${hash}` : url;
}

// Validate environment variables
export function validateConfig() {
	const missing = [];

	if (!process.env.DEFAULT_PASSWORD) missing.push("DEFAULT_PASSWORD");
	if (!process.env.BASE_URL) console.warn("⚠️  BASE_URL not set, using default");
	if (!process.env.SKIN_PARAM) console.warn("⚠️  SKIN_PARAM not set, using default");

	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}

	console.log("✅ Configuration loaded successfully");
}
