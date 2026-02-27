import { test, expect } from '@playwright/test';

test('Verify 3D Interactive Viewer in Exam Runner', async ({ page }) => {
    // Go to the home page to load the app
    await page.goto('http://localhost:3000');

    // Wait to login and basic load
    await page.waitForTimeout(2000);

    // We inject a script to manually trigger the exam runner with our mock exam
    await page.evaluate(() => {
        // Try to access the store to set a mock exam state directly
        const store = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || window;
        console.log("Evaluating script to start exam...");
        // Just click through the UI to start a mock test, let's go to Aluno route
        window.location.href = '/aluno/simulados';
    });

    await page.waitForTimeout(2000);

    // Take a full page screenshot
    await page.screenshot({ path: 'test-results/3d-viewer-test.png', fullPage: true });
});
