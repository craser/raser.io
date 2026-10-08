// ABOUTME: Playwright configuration for end-to-end tests against the real site, real APIs and real flags.
// ABOUTME: Starts `npm run dev` unless a dev server is already running on port 3000.

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './e2e',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:3000'
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } }
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000
    }
});
