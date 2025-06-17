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


## Current State of Things

- Currently in its infancy, still building out some features that were supported by old Java-based site.

## Goals

- replace outdated, expensive-to-host Java/JSP implementation
- personal playground for new ideas/frameworks


## Test Coverage Policy

This project enforces a comprehensive test coverage policy to maintain code quality:

### Coverage Requirements
- **Target**: 70% statement coverage (measured by Jest)
- **Enforcement**: All PRs to `main` must meet coverage requirements
- **Policy Rules**:
  - If main branch coverage < 70%: Every merge must **increase** overall coverage
  - If main branch coverage ≥ 70%: Every merge must **maintain** coverage ≥ 70%

### Local Development Commands

```bash
# Run tests with coverage
npm test -- --coverage

# Run tests with coverage and open HTML report
npm run test:coverage:open

# Check coverage policy (same as CI runs)
npm run coverage:check
```

### Coverage Policy Enforcement
- GitHub Actions automatically checks coverage on all PRs to `main`
- PRs that fail coverage requirements are blocked from merging
- Coverage reports are automatically posted as PR comments
- Full coverage reports are available as workflow artifacts

### Understanding Coverage Reports
The coverage report shows four key metrics:
- **Statements**: Percentage of code statements executed by tests
- **Branches**: Percentage of code branches (if/else, switch cases) tested
- **Functions**: Percentage of functions called by tests  
- **Lines**: Percentage of code lines executed by tests

Our policy is based on **statement coverage** as the primary metric.

### Improving Coverage
If your PR fails the coverage check:

1. **Add tests** for new functionality
2. **Add tests** for existing uncovered code
3. **Remove dead code** that cannot be tested
4. **Refactor complex functions** into smaller, testable units

See the `__tests__/` directory for examples of existing tests.

## Overview

- Front end (this codebase) on Vercel
- Back end is Spring Boot hosted on Heroku

