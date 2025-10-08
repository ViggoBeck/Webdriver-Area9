#!/bin/bash
# Clear all CSV result files but keep the directory

echo "🧹 Clearing CSV result files..."

cd "$(dirname "$0")"

# Clear each CSV file (keeps headers)
if [ -f "results/results-normal.csv" ]; then
    echo "timestamp,test_name,execution_time,account" > results/results-normal.csv
    echo "✅ Cleared results-normal.csv"
fi

if [ -f "results/results-cold.csv" ]; then
    echo "timestamp,test_name,execution_time,account" > results/results-cold.csv
    echo "✅ Cleared results-cold.csv"
fi

if [ -f "results/results-warm.csv" ]; then
    echo "timestamp,test_name,execution_time,account" > results/results-warm.csv
    echo "✅ Cleared results-warm.csv"
fi

if [ -f "results/results-cache-comparison.csv" ]; then
    echo "timestamp,test_name,cold_time,warm_time,improvement_seconds,improvement_percent,account" > results/results-cache-comparison.csv
    echo "✅ Cleared results-cache-comparison.csv"
fi

echo "✨ All CSV files cleared (headers preserved)"
