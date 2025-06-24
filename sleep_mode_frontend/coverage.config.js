/**
 * Comprehensive Code Coverage Configuration for Sleep Mode Frontend
 * Enhanced coverage reporting with detailed thresholds and custom reporting
 */

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // Enhanced coverage provider
      provider: 'v8',
      
      // Multiple report formats for different use cases
      reporter: [
        'text',           // Terminal output
        'text-summary',   // Summary for CI
        'html',          // Interactive HTML report
        'json',          // For programmatic processing
        'json-summary',  // Summary JSON
        'lcov',          // For external tools (SonarQube, Codecov)
        'cobertura',     // XML format for CI/CD
        'clover'         // XML format for various tools
      ],
      
      // Output directories for reports
      reportsDirectory: './coverage',
      
      // Files to exclude from coverage
      exclude: [
        // Dependencies and configuration
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        
        // Test files
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/**/*.spec.{ts,tsx,js,jsx}',
        'src/test-utils/**',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        
        // Configuration files
        'src/vite-env.d.ts',
        'src/main.tsx',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        
        // Generated or vendor files
        'src/assets/**',
        'public/**',
        
        // Development utilities
        'src/dev-tools/**',
        'scripts/**',
      ],
      
      // Files to include (override excludes if needed)
      include: [
        'src/**/*.{ts,tsx,js,jsx}',
      ],
      
      // Branch coverage patterns
      skipFull: false,
      
      // All files flag - include files not covered by tests
      all: true,
      
      // Enhanced thresholds for comprehensive coverage
      thresholds: {
        // Global thresholds - minimum acceptable coverage
        global: {
          branches: 80,    // Branch coverage (if/else, switch cases)
          functions: 85,   // Function coverage
          lines: 85,       // Line coverage
          statements: 85,  // Statement coverage
        },
        
        // Per-file thresholds - stricter for individual files
        perFile: true,
        
        // Component-specific thresholds
        'src/components/**/*.{ts,tsx}': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        
        // Service/utility functions - highest standards
        'src/services/**/*.{ts,tsx}': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        
        // Utils and helpers
        'src/utils/**/*.{ts,tsx}': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        
        // Hooks
        'src/hooks/**/*.{ts,tsx}': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        
        // Pages/routes - slightly lower due to integration complexity
        'src/pages/**/*.{ts,tsx}': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      
      // Watermarks for coverage coloring in reports
      watermarks: {
        statements: [75, 90],
        functions: [75, 90],
        branches: [75, 90],
        lines: [75, 90],
      },
      
      // Clean coverage directory before each run
      clean: true,
      
      // Enable source maps for accurate coverage
      sourcemap: true,
      
      // Additional options for detailed reporting
      allowExternal: false,
      extension: ['.ts', '.tsx', '.js', '.jsx'],
    }
  }
}) 