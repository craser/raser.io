#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Test Coverage Policy Enforcement Script
 * 
 * Policy Rules:
 * - Target: 70% statement coverage
 * - Below 70%: Every merge must INCREASE coverage
 * - At/Above 70%: Every merge must MAINTAIN coverage ≥ 70%
 */

function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function getCoverageFromSummary(summaryPath) {
  if (!fs.existsSync(summaryPath)) {
    console.error(`Coverage summary not found at: ${summaryPath}`);
    return null;
  }
  
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  return summary.total.statements.pct;
}

function generateCoverageReport() {
  console.log('Generating coverage report...');
  runCommand('npm test -- --coverage --passWithNoTests --silent');
  
  const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  return getCoverageFromSummary(summaryPath);
}

function getMainBranchCoverage() {
  console.log('Checking main branch coverage...');
  
  // Store current branch
  const currentBranch = runCommand('git branch --show-current').trim();
  
  try {
    // Fetch latest main
    runCommand('git fetch origin main');
    
    // Stash current changes if any
    const hasChanges = runCommand('git status --porcelain').trim();
    if (hasChanges) {
      runCommand('git stash push -m "coverage-check-temp-stash"');
    }
    
    // Checkout main
    runCommand('git checkout main');
    
    // Generate coverage for main
    const mainCoverage = generateCoverageReport();
    
    // Return to original branch
    runCommand(`git checkout ${currentBranch}`);
    
    // Restore stashed changes if any
    if (hasChanges) {
      runCommand('git stash pop');
    }
    
    return mainCoverage;
  } catch (error) {
    // Ensure we return to original branch on error
    try {
      runCommand(`git checkout ${currentBranch}`);
    } catch (checkoutError) {
      console.error('Failed to return to original branch:', checkoutError.message);
    }
    throw error;
  }
}

function checkCoveragePolicy() {
  console.log('🧪 Running Test Coverage Policy Check');
  console.log('=====================================');
  
  // Get main branch coverage
  const mainCoverage = getMainBranchCoverage();
  console.log(`📊 Main branch coverage: ${mainCoverage}%`);
  
  // Get current branch coverage
  const currentCoverage = generateCoverageReport();
  console.log(`📊 Current branch coverage: ${currentCoverage}%`);
  
  if (mainCoverage === null || currentCoverage === null) {
    console.error('❌ Failed to generate coverage reports');
    process.exit(1);
  }
  
  const TARGET_COVERAGE = 70;
  
  // Apply policy rules
  if (mainCoverage < TARGET_COVERAGE) {
    // Rule 1: If main is below 70%, current must improve coverage
    if (currentCoverage <= mainCoverage) {
      console.error(`❌ Coverage Policy Violation`);
      console.error(`This change must improve test coverage. Please add tests, or remove code to achieve this.`);
      console.error(`Main branch coverage: ${mainCoverage}%`);
      console.error(`Your branch coverage: ${currentCoverage}%`);
      console.error(`Required: Coverage must increase from ${mainCoverage}%`);
      process.exit(1);
    } else {
      console.log(`✅ Coverage improved from ${mainCoverage}% to ${currentCoverage}%`);
      console.log(`Still below target of ${TARGET_COVERAGE}%, but moving in the right direction!`);
    }
  } else {
    // Rule 2: If main is at/above 70%, current must maintain ≥ 70%
    if (currentCoverage < TARGET_COVERAGE) {
      console.error(`❌ Coverage Policy Violation`);
      console.error(`This change would lower the overall test coverage below ${TARGET_COVERAGE}%. A minimum of ${TARGET_COVERAGE}% test coverage is required.`);
      console.error(`Main branch coverage: ${mainCoverage}%`);
      console.error(`Your branch coverage: ${currentCoverage}%`);
      console.error(`Required: Coverage must be ≥ ${TARGET_COVERAGE}%`);
      process.exit(1);
    } else {
      const coverageChange = currentCoverage - mainCoverage;
      const changeText = coverageChange >= 0 ? `+${coverageChange.toFixed(1)}%` : `${coverageChange.toFixed(1)}%`;
      console.log(`✅ Coverage maintained at ${currentCoverage}% (${changeText})`);
    }
  }
  
  console.log('🎉 Coverage policy check passed!');
  
  // Generate coverage report summary for CI
  const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    console.log('\n📈 Coverage Summary:');
    console.log(`   Statements: ${summary.total.statements.pct}% (${summary.total.statements.covered}/${summary.total.statements.total})`);
    console.log(`   Branches: ${summary.total.branches.pct}% (${summary.total.branches.covered}/${summary.total.branches.total})`);
    console.log(`   Functions: ${summary.total.functions.pct}% (${summary.total.functions.covered}/${summary.total.functions.total})`);
    console.log(`   Lines: ${summary.total.lines.pct}% (${summary.total.lines.covered}/${summary.total.lines.total})`);
  }
}

// Check if this is a documentation-only change
function isDocumentationOnlyChange() {
  try {
    const changedFiles = runCommand('git diff --name-only HEAD~1').trim();
    if (!changedFiles) return false;
    
    const files = changedFiles.split('\n');
    const nonDocFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      const filename = path.basename(file).toLowerCase();
      
      // Consider these as documentation/config files that don't affect coverage
      return !(
        ext === '.md' ||
        ext === '.txt' ||
        ext === '.json' && (filename.includes('package') || filename.includes('config')) ||
        filename === 'readme' ||
        file.startsWith('.github/') ||
        file.startsWith('docs/') ||
        file.startsWith('documentation/')
      );
    });
    
    return nonDocFiles.length === 0;
  } catch (error) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  // Check if this is a documentation-only change
  if (isDocumentationOnlyChange()) {
    console.log('📝 Documentation-only change detected. Skipping coverage check.');
    console.log('✅ Coverage policy check passed!');
    process.exit(0);
  }
  
  checkCoveragePolicy();
}

module.exports = {
  checkCoveragePolicy,
  getCoverageFromSummary,
  generateCoverageReport
};