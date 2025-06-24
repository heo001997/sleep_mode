#!/usr/bin/env node
/**
 * Asset Analysis Script for CDN Optimization
 * Analyzes build output for CDN deployment readiness
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(color, prefix, message) {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

function info(message) { log('blue', 'INFO', message); }
function success(message) { log('green', 'SUCCESS', message); }
function warning(message) { log('yellow', 'WARNING', message); }
function error(message) { log('red', 'ERROR', message); }

// Configuration
const buildDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(buildDir, 'assets');
const manifestPath = path.join(buildDir, 'manifest.json');

console.log('📊 Analyzing Build Assets for CDN Deployment...\n');

// Check if build exists
if (!fs.existsSync(buildDir)) {
  error('Build directory not found. Please run build first.');
  process.exit(1);
}

// Asset analysis functions
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath, name) {
  if (!fs.existsSync(dirPath)) {
    return { count: 0, size: 0, files: [] };
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let totalSize = 0;
  let fileCount = 0;
  const fileList = [];

  for (const file of files) {
    if (file.isFile()) {
      const filePath = path.join(dirPath, file.name);
      const size = getFileSize(filePath);
      totalSize += size;
      fileCount++;
      fileList.push({
        name: file.name,
        size: size,
        path: filePath
      });
    }
  }

  return {
    count: fileCount,
    size: totalSize,
    files: fileList.sort((a, b) => b.size - a.size)
  };
}

// Analyze asset types
info('Analyzing asset types...');

const assetTypes = {
  javascript: analyzeDirectory(path.join(assetsDir, 'js'), 'JavaScript'),
  css: analyzeDirectory(path.join(assetsDir, 'css'), 'CSS'),
  images: analyzeDirectory(path.join(assetsDir, 'images'), 'Images'),
  fonts: analyzeDirectory(path.join(assetsDir, 'fonts'), 'Fonts')
};

// Calculate totals
let totalFiles = 0;
let totalSize = 0;

Object.values(assetTypes).forEach(type => {
  totalFiles += type.count;
  totalSize += type.size;
});

// Display analysis results
console.log('📊 Asset Analysis Results:\n');

Object.entries(assetTypes).forEach(([type, data]) => {
  if (data.count > 0) {
    console.log(`  ${type.toUpperCase()}:`);
    console.log(`    Files: ${data.count}`);
    console.log(`    Size: ${formatSize(data.size)}`);
    
    if (data.files.length > 0) {
      console.log(`    Largest files:`);
      data.files.slice(0, 3).forEach(file => {
        console.log(`      ${file.name}: ${formatSize(file.size)}`);
      });
    }
    console.log('');
  }
});

console.log(`  TOTAL: ${totalFiles} files, ${formatSize(totalSize)}\n`);

// Check for large files
info('Checking for large files (>500KB)...');

const largeFiles = [];
Object.values(assetTypes).forEach(type => {
  type.files.forEach(file => {
    if (file.size > 500 * 1024) { // 500KB
      largeFiles.push(file);
    }
  });
});

if (largeFiles.length > 0) {
  warning(`Found ${largeFiles.length} large files:`);
  largeFiles.forEach(file => {
    console.log(`    ${file.name}: ${formatSize(file.size)}`);
  });
  console.log('');
} else {
  success('No large files found');
}

// Analyze manifest
if (fs.existsSync(manifestPath)) {
  info('Analyzing build manifest...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const entryPoints = Object.keys(manifest).filter(key => manifest[key].isEntry);
    const chunks = Object.keys(manifest).length - entryPoints.length;
    
    console.log(`  Entry points: ${entryPoints.length}`);
    console.log(`  Chunks: ${chunks}`);
    console.log('');
    
    success('Manifest analyzed successfully');
  } catch (err) {
    error('Failed to parse manifest file');
  }
} else {
  warning('No manifest file found');
}

// CDN readiness check
info('Checking CDN readiness...');

const checks = [];

// Check for proper asset organization
if (fs.existsSync(assetsDir)) {
  checks.push({ name: 'Asset directory structure', status: 'pass' });
} else {
  checks.push({ name: 'Asset directory structure', status: 'fail', message: 'Assets directory not found' });
}

// Check for versioned files (hashed filenames)
const hasVersionedFiles = Object.values(assetTypes).some(type =>
  type.files.some(file => /\-[a-f0-9]{8,}\.(js|css)$/.test(file.name))
);

if (hasVersionedFiles) {
  checks.push({ name: 'Asset versioning', status: 'pass' });
} else {
  checks.push({ name: 'Asset versioning', status: 'fail', message: 'No versioned assets found' });
}

// Check file sizes for CDN efficiency
const oversizedFiles = largeFiles.length;
if (oversizedFiles === 0) {
  checks.push({ name: 'File size optimization', status: 'pass' });
} else {
  checks.push({ name: 'File size optimization', status: 'warning', message: `${oversizedFiles} large files found` });
}

// Display CDN readiness results
console.log('🚀 CDN Readiness Report:\n');

checks.forEach(check => {
  const status = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
  console.log(`  ${status} ${check.name}`);
  if (check.message) {
    console.log(`      ${check.message}`);
  }
});

const passedChecks = checks.filter(c => c.status === 'pass').length;
const totalChecks = checks.length;

console.log('');
if (passedChecks === totalChecks) {
  success(`All checks passed! Ready for CDN deployment.`);
} else {
  warning(`${passedChecks}/${totalChecks} checks passed. Address issues before CDN deployment.`);
}

// Generate CDN deployment recommendations
console.log('\n💡 CDN Deployment Recommendations:\n');

const recommendations = [];

if (assetTypes.javascript.size > 1024 * 1024) { // 1MB
  recommendations.push('Consider code splitting to reduce JavaScript bundle size');
}

if (assetTypes.images.size > 5 * 1024 * 1024) { // 5MB
  recommendations.push('Optimize images using WebP/AVIF formats and compression');
}

if (largeFiles.length > 0) {
  recommendations.push('Review large files for optimization opportunities');
}

if (recommendations.length > 0) {
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
} else {
  success('No specific recommendations. Build is well optimized!');
}

console.log('\n📦 Asset Analysis Complete!');

// Exit with appropriate code
process.exit(passedChecks === totalChecks ? 0 : 1); 