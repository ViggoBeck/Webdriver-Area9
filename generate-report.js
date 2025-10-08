#!/usr/bin/env node
// HTML Report Generator - Visualize test results from CSV files

import fs from 'fs';
import path from 'path';

const resultsDir = 'results';
const outputFile = 'results/test-report.html';

// Parse CSV file
function parseCSV(filePath) {
	if (!fs.existsSync(filePath)) {
		return [];
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const lines = content.trim().split('\n');

	if (lines.length <= 1) return []; // Only header or empty

	const headers = lines[0].split(',');
	const data = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',');
		const row = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || '';
		});
		data.push(row);
	}

	return data;
}

// Calculate statistics
function calculateStats(data) {
	if (data.length === 0) return null;

	const times = data.map(row => parseFloat(row.execution_time)).filter(t => !isNaN(t));

	if (times.length === 0) return null;

	const sum = times.reduce((a, b) => a + b, 0);
	const avg = sum / times.length;
	const min = Math.min(...times);
	const max = Math.max(...times);

	return {
		count: times.length,
		avg: avg.toFixed(3),
		min: min.toFixed(3),
		max: max.toFixed(3),
		total: sum.toFixed(3)
	};
}

// Generate HTML report
function generateReport() {
	console.log('📊 Generating HTML report...');

	// Read all CSV files
	const normalData = parseCSV(path.join(resultsDir, 'results-normal.csv'));
	const coldData = parseCSV(path.join(resultsDir, 'results-cold.csv'));
	const warmData = parseCSV(path.join(resultsDir, 'results-warm.csv'));
	const comparisonData = parseCSV(path.join(resultsDir, 'results-cache-comparison.csv'));

	// Calculate statistics
	const normalStats = calculateStats(normalData);
	const coldStats = calculateStats(coldData);
	const warmStats = calculateStats(warmData);

	// Get latest run timestamp
	const latestTimestamp = normalData.length > 0
		? new Date(normalData[normalData.length - 1].timestamp).toLocaleString()
		: 'No data';

	// Build HTML
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Area9 Performance Test Report</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 20px;
			color: #333;
		}

		.container {
			max-width: 1400px;
			margin: 0 auto;
		}

		.header {
			background: white;
			border-radius: 12px;
			padding: 30px;
			margin-bottom: 20px;
			box-shadow: 0 8px 16px rgba(0,0,0,0.1);
		}

		.header h1 {
			color: #667eea;
			margin-bottom: 10px;
			font-size: 32px;
		}

		.header .subtitle {
			color: #666;
			font-size: 14px;
		}

		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 20px;
			margin-bottom: 20px;
		}

		.stat-card {
			background: white;
			border-radius: 12px;
			padding: 25px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.08);
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.stat-card:hover {
			transform: translateY(-4px);
			box-shadow: 0 8px 24px rgba(0,0,0,0.12);
		}

		.stat-card h3 {
			color: #667eea;
			margin-bottom: 15px;
			font-size: 16px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.stat-row {
			display: flex;
			justify-content: space-between;
			padding: 8px 0;
			border-bottom: 1px solid #f0f0f0;
		}

		.stat-row:last-child {
			border-bottom: none;
		}

		.stat-label {
			color: #666;
			font-size: 14px;
		}

		.stat-value {
			color: #333;
			font-weight: 600;
			font-size: 14px;
		}

		.table-card {
			background: white;
			border-radius: 12px;
			padding: 25px;
			margin-bottom: 20px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.08);
			overflow-x: auto;
		}

		.table-card h2 {
			color: #667eea;
			margin-bottom: 20px;
			font-size: 20px;
		}

		table {
			width: 100%;
			border-collapse: collapse;
		}

		th {
			background: #f8f9fa;
			padding: 12px;
			text-align: left;
			font-weight: 600;
			color: #333;
			border-bottom: 2px solid #667eea;
			font-size: 14px;
		}

		td {
			padding: 12px;
			border-bottom: 1px solid #e9ecef;
			font-size: 14px;
		}

		tr:hover {
			background: #f8f9fa;
		}

		.badge {
			display: inline-block;
			padding: 4px 12px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 600;
		}

		.badge-success {
			background: #d4edda;
			color: #155724;
		}

		.badge-warning {
			background: #fff3cd;
			color: #856404;
		}

		.badge-info {
			background: #d1ecf1;
			color: #0c5460;
		}

		.improvement-positive {
			color: #28a745;
			font-weight: 600;
		}

		.improvement-negative {
			color: #dc3545;
			font-weight: 600;
		}

		.time-value {
			font-family: 'Courier New', monospace;
			font-weight: 600;
			color: #667eea;
		}

		.no-data {
			text-align: center;
			padding: 40px;
			color: #999;
			font-style: italic;
		}

		.footer {
			text-align: center;
			color: white;
			margin-top: 30px;
			font-size: 14px;
		}

		@media (max-width: 768px) {
			.stats-grid {
				grid-template-columns: 1fr;
			}

			table {
				font-size: 12px;
			}

			th, td {
				padding: 8px;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🚀 Area9 Performance Test Report</h1>
			<div class="subtitle">Latest Run: ${latestTimestamp}</div>
		</div>

		<div class="stats-grid">
			${normalStats ? `
			<div class="stat-card">
				<h3>📊 Normal Workflows</h3>
				<div class="stat-row">
					<span class="stat-label">Tests Run:</span>
					<span class="stat-value">${normalStats.count}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Average Time:</span>
					<span class="stat-value time-value">${normalStats.avg}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Fastest:</span>
					<span class="stat-value time-value">${normalStats.min}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Slowest:</span>
					<span class="stat-value time-value">${normalStats.max}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Total Time:</span>
					<span class="stat-value time-value">${normalStats.total}s</span>
				</div>
			</div>
			` : ''}

			${coldStats ? `
			<div class="stat-card">
				<h3>❄️ Cold Cache Tests</h3>
				<div class="stat-row">
					<span class="stat-label">Tests Run:</span>
					<span class="stat-value">${coldStats.count}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Average Time:</span>
					<span class="stat-value time-value">${coldStats.avg}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Fastest:</span>
					<span class="stat-value time-value">${coldStats.min}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Slowest:</span>
					<span class="stat-value time-value">${coldStats.max}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Total Time:</span>
					<span class="stat-value time-value">${coldStats.total}s</span>
				</div>
			</div>
			` : ''}

			${warmStats ? `
			<div class="stat-card">
				<h3>🔥 Warm Cache Tests</h3>
				<div class="stat-row">
					<span class="stat-label">Tests Run:</span>
					<span class="stat-value">${warmStats.count}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Average Time:</span>
					<span class="stat-value time-value">${warmStats.avg}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Fastest:</span>
					<span class="stat-value time-value">${warmStats.min}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Slowest:</span>
					<span class="stat-value time-value">${warmStats.max}s</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Total Time:</span>
					<span class="stat-value time-value">${warmStats.total}s</span>
				</div>
			</div>
			` : ''}
		</div>

		${comparisonData.length > 0 ? `
		<div class="table-card">
			<h2>⚡ Cache Comparison Results</h2>
			<table>
				<thead>
					<tr>
						<th>Test Name</th>
						<th>Cold Time</th>
						<th>Warm Time</th>
						<th>Improvement</th>
						<th>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					${comparisonData.map(row => {
						const improvement = parseFloat(row.improvement_percent);
						const improvementClass = improvement > 0 ? 'improvement-positive' : 'improvement-negative';
						return `
						<tr>
							<td>${row.test_name}</td>
							<td><span class="time-value">${parseFloat(row.cold_time).toFixed(3)}s</span></td>
							<td><span class="time-value">${parseFloat(row.warm_time).toFixed(3)}s</span></td>
							<td class="${improvementClass}">
								${improvement > 0 ? '↓' : '↑'} ${Math.abs(improvement).toFixed(1)}%
								<span class="badge ${improvement > 20 ? 'badge-success' : improvement > 0 ? 'badge-info' : 'badge-warning'}">
									${parseFloat(row.improvement_seconds).toFixed(3)}s
								</span>
							</td>
							<td>${new Date(row.timestamp).toLocaleString()}</td>
						</tr>
						`;
					}).join('')}
				</tbody>
			</table>
		</div>
		` : ''}

		${normalData.length > 0 ? `
		<div class="table-card">
			<h2>📋 Normal Workflow Results</h2>
			<table>
				<thead>
					<tr>
						<th>Test Name</th>
						<th>Execution Time</th>
						<th>Account</th>
						<th>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					${normalData.slice(-20).reverse().map(row => `
						<tr>
							<td>${row.test_name}</td>
							<td><span class="time-value">${parseFloat(row.execution_time).toFixed(3)}s</span></td>
							<td><code>${row.account || 'N/A'}</code></td>
							<td>${new Date(row.timestamp).toLocaleString()}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
			${normalData.length > 20 ? `<p style="text-align: center; margin-top: 15px; color: #666; font-size: 14px;">Showing latest 20 of ${normalData.length} results</p>` : ''}
		</div>
		` : ''}

		${normalData.length === 0 && comparisonData.length === 0 ? `
		<div class="table-card">
			<div class="no-data">
				No test results found. Run some tests to see results here!<br>
				<code style="margin-top: 10px; display: inline-block;">npm start</code> or
				<code>npm run cache</code>
			</div>
		</div>
		` : ''}

		<div class="footer">
			Generated: ${new Date().toLocaleString()} | Area9 Performance Test Suite
		</div>
	</div>
</body>
</html>`;

	// Write HTML file
	fs.writeFileSync(outputFile, html, 'utf8');
	console.log(`✅ Report generated: ${outputFile}`);
	console.log(`📊 Open in browser: file://${path.resolve(outputFile)}`);
}

// Run report generation
try {
	generateReport();
} catch (error) {
	console.error('❌ Error generating report:', error.message);
	process.exit(1);
}
