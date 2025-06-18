# raser.io: Chris Raser's Personal Blog

## Prerequisites
 - homebrew (`brew` utility)
   - Just used for startup process. If you prefer to install nvm/vercel/etc some other way, go for it.
 - node
 - nvm
 

## Getting Started

### My typical flow for setting up an entirely new machine

  - install brew
  - `brew install nvm`
  - `nvm install node`

### Setting up raser.io for local development

  - `npm install`
  - `brew install vercel-cli`
  - `vercel login`
  - `vercel link`
  - `vercel env pull`
  - `npm run dev-prod` (starts local dev pointing to prod back-end API)


## Testing

This project enforces comprehensive test coverage to maintain code quality.

### Coverage Policy

- **Target**: 70% statement coverage across all source files
- **Enforcement**: Automated on all Pull Requests to `main` branch
- **Policy Rules**:
  - If main branch coverage < 70%: PRs must **improve** overall coverage
  - If main branch coverage ≥ 70%: PRs must **maintain** coverage ≥ 70%
  - PRs that fail coverage requirements cannot be merged

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests with coverage and open HTML report
npm run test:coverage:open
```

### Understanding Coverage Reports

Coverage is measured using Jest's statement coverage across these directories:
- `components/` - React components
- `lib/` - Utility libraries
- `model/` - Data models and DAOs
- `app/` - Next.js app directory
- `pages/` - Next.js pages

**Excluded from coverage**:
- Test files (`*.test.js`, `*.spec.js`)
- Configuration files
- Build artifacts and dependencies
- Mock files and setup files

### Improving Coverage

If your PR fails the coverage check:

1. **Add tests for new code**: Every new component/function should have corresponding tests
2. **Test edge cases**: Cover error conditions and boundary cases
3. **Remove dead code**: Unused code hurts coverage percentage
4. **Use coverage reports**: Run `npm run test:coverage:open` to see exactly which lines need testing

### Coverage Failure Scenarios

**"This change must improve test coverage"**
- Your PR doesn't increase overall coverage when it's currently below 70%
- Add tests for your changes or remove unused code

**"This change would lower the overall test coverage below 70%"**
- Your PR would drop coverage below the minimum threshold
- Add tests to maintain the 70% minimum

### Emergency Procedures

For critical hotfixes that need to bypass coverage requirements, repository administrators can:
1. Temporarily disable branch protection rules
2. Merge the hotfix
3. Re-enable branch protection
4. Follow up with a coverage improvement PR

## Current State of Things

- Currently in its infancy, still building out some features that were supported by old Java-based site.

## Goals

- replace outdated, expensive-to-host Java/JSP implementation
- personal playground for new ideas/frameworks


## Overview

- Front end (this codebase) on Vercel
- Back end is Spring Boot hosted on Heroku

