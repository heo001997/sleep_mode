#!/usr/bin/env node

/**
 * Enhanced Coverage Reporting Script for Sleep Mode Frontend
 * Generates comprehensive coverage reports and enforces quality gates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coverage thresholds matching our configuration
const COVERAGE_THRESHOLDS = {
  global: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85
  },
  components: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  services: {
    statements: 95,
    branches: 90,
    functions: 95,
    lines: 95
  }
};

/**
 * Load and parse coverage summary
 */
function loadCoverageSummary() {
  const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    console.error('❌ Coverage summary not found. Run tests with coverage first.');
    console.log('Run: npm run test:coverage');
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

/**
 * Format coverage percentage with color coding
 */
function formatCoverage(value, threshold) {
  const percentage = Math.round(value * 100) / 100;
  
  if (percentage >= threshold) {
    return `\x1b[32m${percentage}%\x1b[0m`; // Green
  } else if (percentage >= threshold - 10) {
    return `\x1b[33m${percentage}%\x1b[0m`; // Yellow
  } else {
    return `\x1b[31m${percentage}%\x1b[0m`; // Red
  }
}

/**
 * Generate detailed coverage report
 */
function generateCoverageReport(summary) {
  console.log('\n📊 Sleep Mode Frontend - Code Coverage Report');
  console.log('=' .repeat(60));
  
  const total = summary.total;
  
  // Overall coverage summary
  console.log('\n🎯 Overall Coverage:');
  console.log(`  Statements: ${formatCoverage(total.statements.pct, COVERAGE_THRESHOLDS.global.statements)} (${total.statements.covered}/${total.statements.total})`);
  console.log(`  Branches:   ${formatCoverage(total.branches.pct, COVERAGE_THRESHOLDS.global.branches)} (${total.branches.covered}/${total.branches.total})`);
  console.log(`  Functions:  ${formatCoverage(total.functions.pct, COVERAGE_THRESHOLDS.global.functions)} (${total.functions.covered}/${total.functions.total})`);
  console.log(`  Lines:      ${formatCoverage(total.lines.pct, COVERAGE_THRESHOLDS.global.lines)} (${total.lines.covered}/${total.lines.total})`);
  
  // File-by-file analysis
  console.log('\n📁 File Coverage Breakdown:');
  console.log('-'.repeat(100));
  console.log(`${'File'.padEnd(50)} ${'Statements'.padEnd(12)} ${'Branches'.padEnd(12)} ${'Functions'.padEnd(12)} ${'Lines'.padEnd(8)}`);
  console.log('-'.repeat(100));
  
  const files = Object.keys(summary).filter(key => key !== 'total');
  
  // Sort files by overall coverage (lowest first to highlight issues)
  files.sort((a, b) => {
    const avgA = (summary[a].statements.pct + summary[a].branches.pct + summary[a].functions.pct + summary[a].lines.pct) / 4;
    const avgB = (summary[b].statements.pct + summary[b].branches.pct + summary[b].functions.pct + summary[b].lines.pct) / 4;
    return avgA - avgB;
  });
  
  files.forEach(file => {
    const fileData = summary[file];
    const fileName = file.replace(process.cwd() + '/src/', '').slice(0, 48);
    
    // Determine thresholds based on file type
    let thresholds = COVERAGE_THRESHOLDS.global;
    if (file.includes('/components/')) {
      thresholds = COVERAGE_THRESHOLDS.components;
    } else if (file.includes('/services/')) {
      thresholds = COVERAGE_THRESHOLDS.services;
    }
    
    console.log(
      `${fileName.padEnd(50)} ` +
      `${formatCoverage(fileData.statements.pct, thresholds.statements).padEnd(20)} ` +
      `${formatCoverage(fileData.branches.pct, thresholds.branches).padEnd(20)} ` +
      `${formatCoverage(fileData.functions.pct, thresholds.functions).padEnd(20)} ` +
      `${formatCoverage(fileData.lines.pct, thresholds.lines)}`
    );
  });
  
  return checkCoverageThresholds(total);
}

/**
 * Check if coverage meets minimum thresholds
 */
function checkCoverageThresholds(total) {
  console.log('\n🎯 Coverage Threshold Analysis:');
  console.log('-'.repeat(40));
  
  const checks = [
    { name: 'Statements', actual: total.statements.pct, required: COVERAGE_THRESHOLDS.global.statements },
    { name: 'Branches', actual: total.branches.pct, required: COVERAGE_THRESHOLDS.global.branches },
    { name: 'Functions', actual: total.functions.pct, required: COVERAGE_THRESHOLDS.global.functions },
    { name: 'Lines', actual: total.lines.pct, required: COVERAGE_THRESHOLDS.global.lines }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.actual >= check.required;
    const status = passed ? '\x1b[32m✅ PASS\x1b[0m' : '\x1b[31m❌ FAIL\x1b[0m';
    const gap = passed ? '' : ` (${(check.required - check.actual).toFixed(1)}% below threshold)`;
    
    console.log(`  ${check.name.padEnd(12)}: ${status} ${check.actual.toFixed(1)}% >= ${check.required}%${gap}`);
    
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Generate uncovered code report
 */
function generateUncoveredReport(summary) {
  console.log('\n🔍 Uncovered Code Analysis:');
  console.log('-'.repeat(50));
  
  const files = Object.keys(summary).filter(key => key !== 'total');
  
  // Find files with lowest coverage
  const lowCoverageFiles = files
    .map(file => ({
      file,
      coverage: summary[file],
      avgCoverage: (summary[file].statements.pct + summary[file].branches.pct + 
                   summary[file].functions.pct + summary[file].lines.pct) / 4
    }))
    .filter(item => item.avgCoverage < 80)
    .sort((a, b) => a.avgCoverage - b.avgCoverage)
    .slice(0, 10);
  
  if (lowCoverageFiles.length > 0) {
    console.log('\n📉 Files with lowest coverage (top 10):');
    lowCoverageFiles.forEach((item, index) => {
      const fileName = item.file.replace(process.cwd() + '/src/', '');
      console.log(`  ${index + 1}. ${fileName} - ${item.avgCoverage.toFixed(1)}% average coverage`);
    });
  } else {
    console.log('\n🎉 All files meet minimum coverage requirements!');
  }
}

/**
 * Generate coverage badges
 */
function generateCoverageBadges(total) {
  console.log('\n🏆 Coverage Badges:');
  console.log('-'.repeat(30));
  
  const getBadgeColor = (percentage) => {
    if (percentage >= 90) return 'brightgreen';
    if (percentage >= 80) return 'green';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 60) return 'orange';
    return 'red';
  };
  
  const badges = [
    { name: 'Statements', value: total.statements.pct },
    { name: 'Branches', value: total.branches.pct },
    { name: 'Functions', value: total.functions.pct },
    { name: 'Lines', value: total.lines.pct }
  ];
  
  badges.forEach(badge => {
    const color = getBadgeColor(badge.value);
    const badgeUrl = `https://img.shields.io/badge/coverage%20${badge.name.toLowerCase()}-${badge.value.toFixed(1)}%25-${color}`;
    console.log(`  ${badge.name}: ${badgeUrl}`);
  });
}

/**
 * Main execution
 */
function main() {
  try {
    const summary = loadCoverageSummary();
    const thresholdsPassed = generateCoverageReport(summary);
    generateUncoveredReport(summary);
    generateCoverageBadges(summary.total);
    
    console.log('\n📈 Coverage Reports Generated:');
    console.log('  📄 HTML Report: ./coverage/index.html');
    console.log('  📊 JSON Report: ./coverage/coverage-final.json');
    console.log('  🔄 LCOV Report: ./coverage/lcov.info');
    
    if (thresholdsPassed) {
      console.log('\n🎉 All coverage thresholds met! Great job!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some coverage thresholds not met. Please add more tests.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error generating coverage report:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 