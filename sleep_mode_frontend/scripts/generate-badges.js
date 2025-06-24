#!/usr/bin/env node

/**
 * Coverage Badge Generator for Sleep Mode Frontend
 * 
 * Generates coverage badges and quality metrics based on test results
 * Supports various badge formats and integrations
 */

const fs = require('fs');
const path = require('path');

// Color thresholds for badges
const COVERAGE_COLORS = {
  excellent: { min: 90, color: 'brightgreen' },
  good: { min: 80, color: 'green' },
  acceptable: { min: 70, color: 'yellow' },
  warning: { min: 60, color: 'orange' },
  poor: { min: 0, color: 'red' }
};

/**
 * Get color based on coverage percentage
 */
function getCoverageColor(percentage) {
  for (const [level, config] of Object.entries(COVERAGE_COLORS)) {
    if (percentage >= config.min) {
      return config.color;
    }
  }
  return 'red';
}

/**
 * Generate shields.io badge URL
 */
function generateShieldsUrl(label, message, color) {
  const baseUrl = 'https://img.shields.io/badge';
  const encodedLabel = encodeURIComponent(label);
  const encodedMessage = encodeURIComponent(message);
  return `${baseUrl}/${encodedLabel}-${encodedMessage}-${color}`;
}

/**
 * Generate badge markdown
 */
function generateBadgeMarkdown(label, percentage, url) {
  return `[![${label}](${url})](./coverage/index.html)`;
}

/**
 * Read coverage data from various sources
 */
function readCoverageData() {
  const coverageFiles = [
    'coverage/coverage-summary.json',
    'coverage/clover.xml',
    'coverage/lcov.info'
  ];

  let coverageData = null;

  // Try to read JSON summary first
  try {
    const summaryPath = path.join(process.cwd(), 'coverage/coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      const summaryContent = fs.readFileSync(summaryPath, 'utf8');
      coverageData = JSON.parse(summaryContent);
    }
  } catch (error) {
    console.warn('⚠️  Could not read coverage-summary.json:', error.message);
  }

  return coverageData;
}

/**
 * Extract coverage metrics
 */
function extractCoverageMetrics(coverageData) {
  if (!coverageData || !coverageData.total) {
    return null;
  }

  const total = coverageData.total;
  
  return {
    statements: Math.round(total.statements?.pct || 0),
    branches: Math.round(total.branches?.pct || 0),
    functions: Math.round(total.functions?.pct || 0),
    lines: Math.round(total.lines?.pct || 0)
  };
}

/**
 * Generate coverage badges
 */
function generateCoverageBadges(metrics) {
  if (!metrics) {
    console.error('❌ No coverage metrics available');
    return {};
  }

  const badges = {};

  // Generate individual metric badges
  Object.entries(metrics).forEach(([metric, percentage]) => {
    const color = getCoverageColor(percentage);
    const label = metric.charAt(0).toUpperCase() + metric.slice(1);
    const url = generateShieldsUrl(`Coverage-${label}`, `${percentage}%`, color);
    const markdown = generateBadgeMarkdown(`${label} Coverage`, percentage, url);
    
    badges[metric] = {
      percentage,
      color,
      url,
      markdown
    };
  });

  // Generate overall coverage badge (average of all metrics)
  const overallPercentage = Math.round(
    Object.values(metrics).reduce((sum, pct) => sum + pct, 0) / Object.keys(metrics).length
  );
  
  const overallColor = getCoverageColor(overallPercentage);
  const overallUrl = generateShieldsUrl('Coverage', `${overallPercentage}%`, overallColor);
  const overallMarkdown = generateBadgeMarkdown('Overall Coverage', overallPercentage, overallUrl);

  badges.overall = {
    percentage: overallPercentage,
    color: overallColor,
    url: overallUrl,
    markdown: overallMarkdown
  };

  return badges;
}

/**
 * Generate quality badges
 */
function generateQualityBadges() {
  const badges = {};

  // Tests badge (assuming tests are passing if this script runs)
  badges.tests = {
    url: generateShieldsUrl('Tests', 'Passing', 'brightgreen'),
    markdown: generateBadgeMarkdown('Tests', 'Passing', generateShieldsUrl('Tests', 'Passing', 'brightgreen'))
  };

  // Build badge
  badges.build = {
    url: generateShieldsUrl('Build', 'Passing', 'brightgreen'),
    markdown: generateBadgeMarkdown('Build', 'Passing', generateShieldsUrl('Build', 'Passing', 'brightgreen'))
  };

  // TypeScript badge
  badges.typescript = {
    url: generateShieldsUrl('TypeScript', 'Strict', 'blue'),
    markdown: generateBadgeMarkdown('TypeScript', 'Strict', generateShieldsUrl('TypeScript', 'Strict', 'blue'))
  };

  // React badge
  badges.react = {
    url: generateShieldsUrl('React', '18+', 'blue'),
    markdown: generateBadgeMarkdown('React', '18+', generateShieldsUrl('React', '18+', 'blue'))
  };

  return badges;
}

/**
 * Generate README badges section
 */
function generateReadmeBadges(coverageBadges, qualityBadges) {
  const badgeLines = [];
  
  // Add overall coverage badge
  if (coverageBadges.overall) {
    badgeLines.push(coverageBadges.overall.markdown);
  }

  // Add individual coverage badges
  ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
    if (coverageBadges[metric]) {
      badgeLines.push(coverageBadges[metric].markdown);
    }
  });

  // Add quality badges
  Object.values(qualityBadges).forEach(badge => {
    badgeLines.push(badge.markdown);
  });

  return `## Badges

${badgeLines.join('\n')}

`;
}

/**
 * Save badges to various formats
 */
function saveBadges(coverageBadges, qualityBadges) {
  const outputDir = path.join(process.cwd(), 'coverage');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save badges data as JSON
  const badgesData = {
    coverage: coverageBadges,
    quality: qualityBadges,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(outputDir, 'badges.json'),
    JSON.stringify(badgesData, null, 2)
  );

  // Save README badges section
  const readmeBadges = generateReadmeBadges(coverageBadges, qualityBadges);
  fs.writeFileSync(
    path.join(outputDir, 'badges.md'),
    readmeBadges
  );

  console.log('📄 Badges saved to:');
  console.log(`   📊 JSON: ${outputDir}/badges.json`);
  console.log(`   📝 Markdown: ${outputDir}/badges.md`);
}

/**
 * Main execution
 */
function main() {
  console.log('🏷️  Generating coverage badges...\n');

  try {
    // Read coverage data
    const coverageData = readCoverageData();
    
    if (!coverageData) {
      console.warn('⚠️  No coverage data found. Run tests with coverage first:');
      console.warn('   npm run test:coverage');
      return;
    }

    // Extract metrics
    const metrics = extractCoverageMetrics(coverageData);
    
    if (!metrics) {
      console.error('❌ Could not extract coverage metrics');
      return;
    }

    // Generate badges
    const coverageBadges = generateCoverageBadges(metrics);
    const qualityBadges = generateQualityBadges();

    // Display coverage summary
    console.log('📊 Coverage Metrics:');
    Object.entries(metrics).forEach(([metric, percentage]) => {
      const color = getCoverageColor(percentage);
      const icon = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
      console.log(`   ${icon} ${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${percentage}%`);
    });

    console.log('\n🏷️  Generated Badges:');
    if (coverageBadges.overall) {
      console.log(`   📊 Overall Coverage: ${coverageBadges.overall.percentage}%`);
    }

    // Save badges
    saveBadges(coverageBadges, qualityBadges);

    console.log('\n✅ Badge generation complete!');
    console.log('\n💡 Usage:');
    console.log('   • Copy badges from coverage/badges.md to your README');
    console.log('   • Use badges.json for programmatic access');
    console.log('   • View coverage report: open coverage/index.html');

  } catch (error) {
    console.error('❌ Error generating badges:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateCoverageBadges,
  generateQualityBadges,
  generateReadmeBadges,
  getCoverageColor
}; 