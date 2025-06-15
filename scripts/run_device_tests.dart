#!/usr/bin/env dart
/// Device Matrix Test Execution Script
/// Runs comprehensive tests across configured device matrix
/// Usage: dart run scripts/run_device_tests.dart [preset]

import 'dart:io';
import 'dart:convert';
import '../test/config/test_config.dart';
import '../test/helpers/test_runner.dart';

Future<void> main(List<String> arguments) async {
  print('🚀 Sleep Mode App - Device Matrix Test Runner');
  print('═══════════════════════════════════════════════');

  // Parse command line arguments
  final preset = arguments.isNotEmpty ? arguments[0] : 'local';
  
  print('📱 Selected preset: $preset');
  print('');

  try {
    DeviceMatrixTestRunner runner;
    
    // Create test runner based on preset
    switch (preset.toLowerCase()) {
      case 'quick':
      case 'quick-local':
        runner = TestRunnerFactory.createQuickLocal();
        break;
        
      case 'local':
      case 'comprehensive-local':
        runner = TestRunnerFactory.createComprehensiveLocal();
        break;
        
      case 'firebase':
      case 'firebase-test-lab':
        runner = TestRunnerFactory.createFirebaseTestLab();
        break;
        
      case 'ci':
        runner = TestRunnerFactory.createCI();
        break;
        
      default:
        print('❌ Unknown preset: $preset');
        print('Available presets: quick, local, firebase, ci');
        exit(1);
    }

    // Display test configuration
    _displayTestConfiguration(runner);
    
    // Confirm execution
    if (!await _confirmExecution(preset)) {
      print('Test execution cancelled by user.');
      exit(0);
    }

    // Run the tests
    print('\n🧪 Starting test execution...');
    final summary = await runner.runTests();
    
    // Display results
    _displayResults(summary);
    
    // Check if tests meet quality gates
    final success = _checkQualityGates(summary, preset);
    
    if (success) {
      print('\n🎉 All quality gates passed!');
      exit(0);
    } else {
      print('\n❌ Quality gates failed!');
      exit(1);
    }
    
  } catch (e, stackTrace) {
    print('\n💥 Test execution failed:');
    print('Error: $e');
    print('Stack trace: $stackTrace');
    exit(1);
  }
}

/// Display test configuration before execution
void _displayTestConfiguration(DeviceMatrixTestRunner runner) {
  print('📋 Test Configuration:');
  print('   Environment: ${runner.config.environment}');
  print('   Timeout: ${runner.config.timeout.inMinutes} minutes');
  print('   Retry attempts: ${runner.config.retryAttempts}');
  print('   Performance metrics: ${runner.config.collectPerformanceMetrics}');
  print('   Screenshots: ${runner.config.captureScreenshots}');
  print('   Video recording: ${runner.config.enableVideoRecording}');
  print('');
  
  print('📱 Target Devices (${runner.devices.length}):');
  for (final device in runner.devices) {
    final features = device.specialFeatures.isNotEmpty 
        ? ' (${device.specialFeatures.join(', ')})'
        : '';
    print('   • ${device.deviceName} - API ${device.apiLevel} - ${device.tier}$features');
  }
  print('');
  
  print('🧪 Test Categories (${runner.testCategories.length}):');
  for (final category in runner.testCategories) {
    print('   • ${category.replaceAll('_', ' ').toUpperCase()}');
  }
  print('');
}

/// Confirm test execution with user
Future<bool> _confirmExecution(String preset) async {
  // Auto-confirm for CI environments
  if (preset.toLowerCase() == 'ci' || 
      Platform.environment['CI'] == 'true' ||
      Platform.environment['FLUTTER_TEST'] == 'true') {
    return true;
  }
  
  print('⚠️  Do you want to proceed with test execution? (y/N): ');
  final input = stdin.readLineSync()?.toLowerCase();
  return input == 'y' || input == 'yes';
}

/// Display test results summary
void _displayResults(TestSummary summary) {
  print('\n📊 Test Results Summary:');
  print('═══════════════════════════════════════');
  
  final totalTests = summary.results.length;
  final passedTests = summary.results.where((r) => r.passed).length;
  final failedTests = totalTests - passedTests;
  final overallPassRate = totalTests > 0 ? (passedTests / totalTests * 100) : 0;
  
  print('📈 Overall Statistics:');
  print('   Total tests: $totalTests');
  print('   Passed: $passedTests');
  print('   Failed: $failedTests');
  print('   Pass rate: ${overallPassRate.toStringAsFixed(1)}%');
  print('   Duration: ${summary.endTime.difference(summary.startTime).inMinutes} minutes');
  print('');
  
  // Pass rate by tier
  print('📱 Pass Rate by Device Tier:');
  final tierRates = summary.getPassRateByTier();
  tierRates.forEach((tier, rate) {
    final status = _getTierStatus(tier, rate);
    print('   $tier: ${(rate * 100).toStringAsFixed(1)}% $status');
  });
  print('');
  
  // Pass rate by category
  print('🧪 Pass Rate by Test Category:');
  final categoryRates = summary.getPassRateByCategory();
  categoryRates.forEach((category, rate) {
    final displayName = category.replaceAll('_', ' ').toUpperCase();
    print('   $displayName: ${(rate * 100).toStringAsFixed(1)}%');
  });
  print('');
  
  // Failed tests by device
  final failedByDevice = summary.getFailedTestsByDevice();
  if (failedByDevice.isNotEmpty) {
    print('❌ Failed Tests by Device:');
    failedByDevice.forEach((device, failures) {
      print('   $device (${failures.length} failures):');
      for (final failure in failures.take(5)) {
        final error = failure.errorMessage ?? 'Test failed';
        print('     • ${failure.scenarioId}: ${error.split('\n').first}');
      }
      if (failures.length > 5) {
        print('     ... and ${failures.length - 5} more');
      }
    });
    print('');
  }
}

/// Get status emoji for tier pass rate
String _getTierStatus(String tier, double rate) {
  final ratePercent = rate * 100;
  
  switch (tier) {
    case 'flagship':
    case 'emulator':
      return ratePercent >= 100 ? '✅' : ratePercent >= 95 ? '⚠️' : '❌';
    case 'mid-range':
      return ratePercent >= 95 ? '✅' : ratePercent >= 90 ? '⚠️' : '❌';
    case 'budget':
      return ratePercent >= 85 ? '✅' : ratePercent >= 80 ? '⚠️' : '❌';
    case 'legacy':
      return ratePercent >= 70 ? '✅' : ratePercent >= 60 ? '⚠️' : '❌';
    default:
      return ratePercent >= 85 ? '✅' : '❌';
  }
}

/// Check quality gates based on preset requirements
bool _checkQualityGates(TestSummary summary, String preset) {
  print('🚪 Quality Gate Checks:');
  
  final tierRates = summary.getPassRateByTier();
  bool allGatesPassed = true;
  
  // Define requirements based on preset
  Map<String, double> requirements;
  switch (preset.toLowerCase()) {
    case 'quick':
    case 'quick-local':
      requirements = {
        'emulator': 95.0,
      };
      break;
      
    case 'local':
    case 'comprehensive-local':
      requirements = {
        'emulator': 98.0,
        'flagship': 95.0,
      };
      break;
      
    case 'firebase':
    case 'firebase-test-lab':
      requirements = {
        'flagship': 100.0,
        'mid-range': 95.0,
        'budget': 85.0,
      };
      break;
      
    case 'ci':
      requirements = {
        'emulator': 95.0,
      };
      break;
      
    default:
      requirements = {
        'flagship': 95.0,
        'mid-range': 90.0,
        'budget': 80.0,
        'legacy': 70.0,
      };
  }
  
  // Check each requirement
  for (final entry in requirements.entries) {
    final tier = entry.key;
    final required = entry.value;
    final actual = (tierRates[tier] ?? 0.0) * 100;
    
    final passed = actual >= required;
    final status = passed ? '✅' : '❌';
    
    print('   $tier: ${actual.toStringAsFixed(1)}% (required: ${required.toStringAsFixed(1)}%) $status');
    
    if (!passed) {
      allGatesPassed = false;
    }
  }
  
  // Overall pass rate gate
  final totalTests = summary.results.length;
  final passedTests = summary.results.where((r) => r.passed).length;
  final overallRate = totalTests > 0 ? (passedTests / totalTests * 100) : 0;
  final overallRequired = preset.toLowerCase() == 'firebase' ? 95.0 : 85.0;
  
  final overallPassed = overallRate >= overallRequired;
  final overallStatus = overallPassed ? '✅' : '❌';
  
  print('   Overall: ${overallRate.toStringAsFixed(1)}% (required: ${overallRequired.toStringAsFixed(1)}%) $overallStatus');
  
  if (!overallPassed) {
    allGatesPassed = false;
  }
  
  return allGatesPassed;
}

/// Display usage information
void _displayUsage() {
  print('Usage: dart run scripts/run_device_tests.dart [preset]');
  print('');
  print('Available presets:');
  print('  quick          - Quick local testing (2 emulators, critical tests)');
  print('  local          - Comprehensive local testing (emulators + devices)');
  print('  firebase       - Firebase Test Lab testing (cloud devices)');
  print('  ci             - CI pipeline testing (emulators only)');
  print('');
  print('Examples:');
  print('  dart run scripts/run_device_tests.dart quick');
  print('  dart run scripts/run_device_tests.dart firebase');
  print('  dart run scripts/run_device_tests.dart ci');
} 