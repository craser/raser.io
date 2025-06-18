# Test Coverage Policy Setup Guide

This guide provides step-by-step instructions for setting up the automated test coverage policy enforcement system.

## Overview

The coverage policy system consists of:
- ✅ **Jest Configuration** - Enhanced with coverage collection and thresholds
- ✅ **Coverage Checking Script** - Implements the 70% coverage policy rules
- ✅ **GitHub Actions Workflow** - Automated coverage validation on PRs
- 🔲 **Branch Protection Rules** - Prevents merging PRs that fail coverage (requires manual setup)

## Manual Setup Required

### 1. Enable Branch Protection Rules

Since GitHub branch protection rules cannot be set programmatically, you need to configure them manually:

1. **Navigate to Repository Settings**:
   - Go to your repository on GitHub
   - Click **Settings** tab
   - Click **Branches** in the left sidebar

2. **Add Branch Protection Rule**:
   - Click **Add rule**
   - Enter `main` as the branch name pattern

3. **Configure Protection Settings**:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Under "Status checks that are required", search for and select:
     - `coverage-check` (this will appear after the first workflow run)

4. **Additional Recommended Settings**:
   - ✅ **Require pull request reviews before merging**
   - ✅ **Dismiss stale PR approvals when new commits are pushed**
   - ✅ **Require review from code owners** (if you have a CODEOWNERS file)
   - ✅ **Restrict pushes that create files**
   - ✅ **Allow force pushes** → **Everyone** (unchecked - disabled)
   - ✅ **Allow deletions** (unchecked - disabled)

### 2. Verify Workflow Setup

After the first PR is created, verify the workflow is working:

1. **Check Workflow Runs**:
   - Go to **Actions** tab in your repository
   - Look for "Test Coverage Policy" workflow runs
   - Verify it's running on pull requests to `main`

2. **Check Status Checks**:
   - Create a test PR
   - Verify the `coverage-check` status appears in the PR
   - Verify the coverage report comment is posted

### 3. Test the Implementation

Create test PRs to validate the coverage policy:

#### Test Case 1: Coverage Improvement (when below 70%)
- Create a PR that adds tests to improve coverage
- Should pass with message: "Coverage improved from X% to Y%"

#### Test Case 2: Coverage Maintenance (when above 70%)
- Create a PR that maintains coverage above 70%
- Should pass with message: "Coverage maintained at X%"

#### Test Case 3: Coverage Violation (drops below 70%)
- Create a PR that would reduce coverage below 70%
- Should fail with message: "This change would lower the overall test coverage below 70%"

#### Test Case 4: No Improvement (when below 70%)
- Create a PR that doesn't improve coverage when below 70%
- Should fail with message: "This change must improve test coverage"

#### Test Case 5: Documentation-Only Change
- Create a PR that only changes `.md` files or documentation
- Should pass with message: "Documentation-only change detected"

## Current Coverage Status

To check the current coverage status of your repository:

```bash
# Install dependencies
npm install

# Run coverage report
npm run test:coverage

# Check coverage policy
npm run coverage:policy
```

## Troubleshooting

### Common Issues

**1. "Coverage summary not found" Error**
```bash
# Ensure tests run successfully first
npm test
# Then run coverage
npm run test:coverage
```

**2. Workflow Not Triggering**
- Verify the workflow file is in `.github/workflows/coverage-check.yml`
- Check that the workflow has proper permissions
- Ensure the branch protection rule includes the correct status check name

**3. Coverage Check Fails on Valid Changes**
- Check that the file exclusions in `jest.config.json` are correct
- Verify that test files aren't being included in coverage calculation
- Review the coverage report to understand what's being measured

**4. Git Operations Fail in Script**
- Ensure the repository has full git history (`fetch-depth: 0` in workflow)
- Check that the main branch is accessible
- Verify git configuration in the CI environment

### Getting Help

If you encounter issues:

1. **Check Workflow Logs**: View detailed logs in the Actions tab
2. **Review Coverage Reports**: Check the generated coverage reports for accuracy
3. **Validate Jest Config**: Ensure the Jest configuration is working locally
4. **Test Script Locally**: Run `npm run coverage:policy` to debug issues

## Policy Customization

### Changing the Coverage Target

To modify the 70% coverage target:

1. **Update Jest Config** (`jest.config.json`):
   ```json
   "coverageThreshold": {
     "global": {
       "statements": 80  // Change to desired percentage
     }
   }
   ```

2. **Update Coverage Script** (`scripts/check-coverage.js`):
   ```javascript
   const TARGET_COVERAGE = 80;  // Change to match Jest config
   ```

3. **Update Documentation** (`README.md`):
   - Update all references to the coverage percentage

### Adding File Exclusions

To exclude additional files from coverage:

**Update `jest.config.json`**:
```json
"collectCoverageFrom": [
  // ... existing patterns ...
  "!**/your-file-pattern/**"
]
```

### Customizing Error Messages

Edit the error messages in `scripts/check-coverage.js` to match your team's preferences.

## Security Considerations

- The coverage check script requires git operations and file system access
- Workflow permissions are minimal (only needs to read code and post comments)
- No sensitive information is exposed in coverage reports
- Branch protection rules prevent bypassing coverage requirements

## Implementation Complete

✅ All implementation tasks have been completed. The coverage policy system is ready for use once you complete the manual branch protection setup above.