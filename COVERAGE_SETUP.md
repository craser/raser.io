# Test Coverage Policy Setup Guide

This document provides detailed setup instructions and architecture overview for the comprehensive test coverage policy enforcement system.

## Overview

The coverage policy system automatically enforces a 70% statement coverage threshold on all Pull Requests to the `main` branch. It compares PR coverage against the current main branch coverage and applies different rules based on the current state.

## Architecture

### Components

1. **Jest Configuration** (`jest.config.json`)
   - Configures coverage collection from source files only
   - Sets coverage thresholds for local development
   - Excludes test files, config files, and build artifacts
   - Generates JSON summary for CI integration

2. **GitHub Actions Workflow** (`.github/workflows/coverage-enforcement.yml`)
   - Runs on every PR to `main`
   - Compares PR coverage with main branch coverage
   - Applies policy rules and blocks merges if requirements not met
   - Posts detailed coverage reports as PR comments

3. **Branch Protection Rules** (manual setup required)
   - Requires `coverage-check` status to pass before merge
   - Prevents bypassing coverage requirements

## Manual Setup Required

### Branch Protection Rules

After implementing the code changes, you must configure GitHub branch protection rules:

1. Go to **Settings** → **Branches** in your GitHub repository
2. Click **Add rule** or edit existing rule for `main` branch
3. Configure these settings:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Status checks that are required**: Add `coverage-check`
   - ✅ **Restrict pushes that create files that do not exist in the current branch**
   - ✅ **Do not allow bypassing the above settings**

4. Save the protection rule

### Verification

Test the setup by creating a test PR that would fail coverage requirements and verify it's blocked from merging.

## Policy Logic

### Coverage Rules

The system applies different rules based on the current main branch coverage:

#### Case 1: Main Branch Coverage < 70%
- **Rule**: PR must **improve** overall coverage
- **Logic**: `PR_coverage > Main_coverage`
- **Message**: "This change must improve test coverage. Please add tests, or remove code to achieve this."

#### Case 2: Main Branch Coverage ≥ 70%
- **Rule**: PR must **maintain** coverage ≥ 70%
- **Logic**: `PR_coverage >= 70`
- **Message**: "This change would lower the overall test coverage below 70%. A minimum of 70% test coverage is required."

#### Special Case: Non-Source Changes
- **Rule**: Automatically pass coverage checks
- **Detection**: Only documentation, configuration, or test files modified
- **Message**: "No source code changes detected. Coverage check skipped."

### File Classification

**Source Files** (counted in coverage):
- `components/**/*.{js,jsx}`
- `lib/**/*.{js,jsx}`
- `model/**/*.{js,jsx}`
- `app/**/*.{js,jsx}`
- `pages/**/*.{js,jsx}`

**Excluded Files** (not counted):
- Test files: `**/*.test.{js,jsx}`, `**/*.spec.{js,jsx}`
- Test directories: `**/__tests__/**`, `**/__mocks__/**`
- Config files: `**/*.config.{js,jsx}`, `jest.setup.js`
- Build artifacts: `**/build/**`, `**/dist/**`, `**/coverage/**`
- Next.js system files: `pages/_app.js`, `pages/_document.js`

## Local Development

### Running Coverage Locally

```bash
# Run tests with coverage
npm run test:coverage

# Open HTML coverage report
npm run test:coverage:open

# Run specific test with coverage
npm test -- --coverage ComponentName.test.js
```

### Coverage Thresholds

Local Jest configuration enforces 70% coverage thresholds for:
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

Tests will fail locally if coverage drops below these thresholds.

### Interpreting Coverage Reports

#### Text Output
```
=============================== Coverage summary ===============================
Statements   : 75.5% ( 150/199 )
Branches     : 68.2% ( 45/66 )
Functions    : 80.0% ( 40/50 )
Lines        : 74.1% ( 140/189 )
================================================================================
```

#### HTML Report
- Open `coverage/lcov-report/index.html` after running coverage
- Click on files to see line-by-line coverage
- Red lines = not covered, green lines = covered

## Troubleshooting

### Common Issues

#### "Coverage file not found"
- Ensure tests are running successfully
- Check that Jest configuration is valid
- Verify `npm run test:coverage` works locally

#### "Policy check failed but coverage looks good"
- Coverage comparison uses floating-point math
- Small rounding differences can cause failures
- Check the exact percentages in the workflow logs

#### "Status check not appearing"
- Verify branch protection rules include `coverage-check`
- Ensure GitHub Actions workflow file is in the correct location
- Check that the workflow is enabled in repository settings

### Debugging Workflow

1. **Check GitHub Actions logs**:
   - Go to Actions tab in GitHub repository
   - Find the failing coverage-enforcement workflow
   - Review step-by-step logs for errors

2. **Test locally**:
   ```bash
   # Run the same commands as CI
   npm ci
   npm run test:coverage
   cat coverage/coverage-summary.json
   ```

3. **Verify file changes**:
   ```bash
   # Check what files changed
   git diff --name-only main...your-branch
   ```

## Emergency Procedures

### Hotfix Process

For urgent fixes that need to bypass coverage:

1. **Temporarily disable branch protection**:
   - Go to Settings → Branches
   - Edit `main` branch rule
   - Uncheck "Require status checks to pass"
   - Save changes

2. **Merge hotfix**:
   - Create and merge PR immediately
   - Document the bypass in PR comments

3. **Re-enable protection**:
   - Go back to branch settings
   - Re-check "Require status checks to pass"
   - Add `coverage-check` back to required status checks

4. **Follow-up**:
   - Create issue to address coverage debt
   - Plan coverage improvement in next sprint

### Manual Override

Repository administrators can:
- Use "Administrator" checkbox to bypass protection rules
- Merge PRs that fail coverage checks
- Should only be used for emergencies

## Testing the Implementation

### Test Scenarios

Create test PRs to validate:

1. **Coverage improvement** (when main < 70%):
   - Add tests to increase coverage
   - Verify PR passes

2. **Coverage maintenance** (when main ≥ 70%):
   - Make changes that maintain coverage
   - Verify PR passes

3. **Coverage degradation**:
   - Remove tests or add untested code
   - Verify PR is blocked

4. **Documentation-only changes**:
   - Update README.md only
   - Verify PR passes automatically

5. **Mixed changes**:
   - Update both source code and documentation
   - Verify coverage rules apply to source changes

### Validation Checklist

- [ ] Branch protection rule configured
- [ ] Test PR with good coverage passes
- [ ] Test PR with bad coverage is blocked
- [ ] Documentation-only PR passes
- [ ] Coverage comments appear on PRs
- [ ] Local coverage commands work
- [ ] HTML coverage reports generate

## Configuration Reference

### Jest Configuration

Key settings in `jest.config.json`:

```json
{
  "collectCoverage": true,
  "collectCoverageFrom": [
    "components/**/*.{js,jsx}",
    "lib/**/*.{js,jsx}", 
    "model/**/*.{js,jsx}",
    "app/**/*.{js,jsx}",
    "pages/**/*.{js,jsx}",
    "!**/*.test.{js,jsx}",
    "!**/__tests__/**"
  ],
  "coverageReporters": ["text", "lcov", "json-summary"],
  "coverageThreshold": {
    "global": {
      "statements": 70,
      "branches": 70,
      "functions": 70,
      "lines": 70
    }
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:coverage:open": "open coverage/lcov-report/index.html"
  }
}
```

### GitHub Actions Workflow

Located at `.github/workflows/coverage-enforcement.yml`, the workflow:
- Triggers on PRs to `main`
- Compares coverage between branches
- Posts PR comments with results
- Sets status check for branch protection

## Future Enhancements

Potential improvements:
- **Coverage trending**: Track coverage changes over time
- **Branch coverage**: Add branch coverage requirements
- **File-level thresholds**: Set per-directory requirements
- **Integration**: Connect with external tools like Codecov
- **Performance**: Cache coverage calculations for faster CI

## Support

For questions or issues with the coverage policy:
1. Check this documentation first
2. Review GitHub Actions logs
3. Test coverage commands locally
4. Create issue with debugging information