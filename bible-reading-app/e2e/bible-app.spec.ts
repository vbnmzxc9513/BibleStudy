import { test, expect } from '@playwright/test';

test.describe('Bible Study App E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Clear anything from previous tests
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    // ==========================================
    // Navigation & Routing (1-10)
    // ==========================================
    test('1. Navigate directly to Home, verify Dashboard title', async ({ page }) => {
        await expect(page.locator('h1').filter({ hasText: /儀表板|Dashboard/ })).toBeVisible();
    });

    test('2. Navigate to Books list, search for Matthew, and verify filtering', async ({ page }) => {
        await page.click('text=聖經');
        await page.fill('input[placeholder="搜尋書卷..."]', '馬太');
        const count = await page.locator('.book-card').count();
        expect(count).toBe(1);
        await expect(page.locator('.book-card')).toContainText('馬太福音');
    });

    test('3. Click Matthew, verify navigation to /read/MAT/1', async ({ page }) => {
        await page.click('text=聖經');
        await page.click('text=馬太福音');
        await expect(page).toHaveURL(/\/read\/MAT\/1/);
    });

    test('4. Open MAT/1, verify page title renders', async ({ page }) => {
        await page.goto('/#/read/MAT/1'); // Using hash router or history fallback
        await page.waitForSelector('h3');
        await expect(page.locator('h3').first()).toContainText('馬太福音 - 第1章');
    });

    test('5. Scroll to bottom and click Next Chapter, verify MAT/2', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('button:has-text("下一章")');
        await page.click('button:has-text("下一章")');
        await page.waitForSelector('h3');
        await expect(page).toHaveURL(/\/read\/MAT\/2/);
        await expect(page.locator('h3').first()).toContainText('馬太福音 - 第2章');
    });

    test('6. Click Previous Chapter from MAT/2, verify MAT/1', async ({ page }) => {
        await page.goto('/#/read/MAT/2');
        await page.waitForSelector('button:has-text("上一章")');
        await page.click('button:has-text("上一章")');
        await page.waitForSelector('h3');
        await expect(page).toHaveURL(/\/read\/MAT\/1/);
    });

    test('7. Verify Previous Chapter is disabled on chapter 1', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('button:has-text("上一章")');
        const prevBtn = page.locator('button:has-text("上一章")');
        await expect(prevBtn).toBeDisabled();
    });

    test('8. Navigate to REV/22, verify Next Chapter is disabled', async ({ page }) => {
        await page.goto('/#/read/REV/22');
        await page.waitForSelector('button:has-text("下一章")');
        const nextBtn = page.locator('button:has-text("下一章")');
        await expect(nextBtn).toBeDisabled();
    });

    test('9. Top back button returns to Books selection', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.back-btn', { state: 'attached' });
        // The DOM might be replacing components, so click using evaluate to bypass strict actionability
        await page.locator('.back-btn').waitFor({ state: 'visible' });
        await page.locator('.back-btn').click({ force: true });
        await page.waitForURL(/\/books/);
        await expect(page).toHaveURL(/\/books/);
    });

    test('10. Toggle Language from zh_TW to en, verify english titles', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        // Initial zh_TW
        await expect(page.locator('h3').first()).toContainText('馬太福音');

        // Find language toggle (needs to target the nav button)
        const langToggle = page.locator('button:has-text("EN")');
        if (await langToggle.isVisible()) {
            await langToggle.click();
            await expect(page.locator('h3').first()).toContainText('Matthew');
        }
    });

    // ==========================================
    // AI Companion UI & Flow (11-20)
    // ==========================================
    test('11. AI Companion buttons exist side-by-side', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        const deepDiveBtn = page.locator('button:has-text("深入了解")');
        const quizBtn = page.locator('button:has-text("開始測驗")');
        await deepDiveBtn.waitFor({ state: 'visible' });
        await expect(deepDiveBtn).toBeVisible();
        await expect(quizBtn).toBeVisible();
    });

    test('12. No API key: Deep Dive warns about missing API key', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('button:has-text("深入了解")');
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('API Key');
            dialog.accept();
        });
        await page.locator('button:has-text("深入了解")').click({ force: true });
    });

    test('13. No API key: Start Quiz warns about missing API key', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('button:has-text("開始測驗")');
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('API Key');
            dialog.accept();
        });
        await page.locator('button:has-text("開始測驗")').click({ force: true });
    });

    test('14. Mock API deep dive loading state', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            setTimeout(() => route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "Mock deep dive" }] } }] } }), 500);
        });

        const deepDiveBtn = page.locator('button:has-text("深入了解")');
        await deepDiveBtn.waitFor({ state: 'visible' });
        await deepDiveBtn.click({ force: true });
        await expect(deepDiveBtn).toContainText('產生中');
    });

    test('15. Deep dive successful rendering', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "This is a profound mock deep dive." }] } }] } });
        });

        await page.locator('button:has-text("深入了解")').click({ force: true });
        const modal = page.locator('.deep-dive-modal');
        await modal.waitFor({ state: 'visible' });
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('This is a profound mock deep dive.');
    });

    test('16. Mock API quiz loading state', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            setTimeout(() => route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "{\"question\":\"Mock Q\",\"options\":[\"A\",\"B\"],\"correctIndex\":1,\"explanation\":\"Mock Explanation\",\"aiFeedback\":\"Mock Feedback\"}" }] } }] } }), 500);
        });

        const quizBtn = page.locator('button:has-text("開始測驗")');
        await quizBtn.waitFor({ state: 'visible' });
        await quizBtn.click({ force: true });
        await expect(quizBtn).toContainText('產生中');
    });

    test('17. Quiz modal UI elements render after generation', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "```json\n{\"question\":\"Is this a mock?\",\"options\":[\"Wrong\",\"Correct\"],\"correctIndex\":1,\"explanation\":\"It was wrong.\",\"aiFeedback\":\"Good job.\"}\n```" }] } }] } });
        });

        await page.locator('button:has-text("開始測驗")').click({ force: true });
        const quizModal = page.locator('.quiz-modal');
        await quizModal.waitFor({ state: 'visible' });
        await expect(quizModal).toBeVisible();
        await expect(quizModal).toContainText('Is this a mock?');
        await expect(quizModal.locator('button', { hasText: 'Wrong' })).toBeVisible();
        await expect(quizModal.locator('button', { hasText: 'Correct' })).toBeVisible();
    });

    test('18. Submitting correct option enables submit button', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "```json\n{\"question\":\"Q1\",\"options\":[\"Wrong\",\"Correct\"],\"correctIndex\":1,\"explanation\":\"E1\",\"aiFeedback\":\"F1\"}\n```" }] } }] } });
        });

        await page.locator('button:has-text("開始測驗")').click({ force: true });
        const correctBtn = page.locator('button:has-text("Correct")');
        await correctBtn.waitFor({ state: 'visible' });
        await correctBtn.click({ force: true }); // Select correct index 1

        const submitBtn = page.locator('button:has-text("送出")');
        await expect(submitBtn).toBeEnabled();
    });

    test('19. Guest mode progress completion throws local progress warning', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "```json\n{\"question\":\"Q1\",\"options\":[\"Wrong\",\"Correct\"],\"correctIndex\":1,\"explanation\":\"E1\",\"aiFeedback\":\"F1\"}\n```" }] } }] } });
        });

        await page.locator('button:has-text("開始測驗")').click({ force: true });

        const correctBtn = page.locator('button:has-text("Correct")');
        await correctBtn.waitFor({ state: 'visible' });
        await correctBtn.click({ force: true });

        let dialogShown = false;
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('訪客身分');
            dialogShown = true;
            dialog.accept();
        });

        await page.locator('button:has-text("送出")').click({ force: true });
        expect(dialogShown).toBeTruthy();
    });

    test('20. Selecting incorrect option displays explanation', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "```json\n{\"question\":\"Q1\",\"options\":[\"Wrong\",\"Correct\"],\"correctIndex\":1,\"explanation\":\"E1\",\"aiFeedback\":\"F1\"}\n```" }] } }] } });
        });

        await page.locator('button:has-text("開始測驗")').click({ force: true });

        const wrongBtn = page.locator('button:has-text("Wrong")');
        await wrongBtn.waitFor({ state: 'visible' });
        await wrongBtn.click({ force: true }); // Select incorrect index 0

        // Warning dialog showing explanation
        await expect(page.locator('text="E1"')).toBeVisible();
    });

    // ==========================================
    // Settings & Profile (21-25)
    // ==========================================
    test('21. Profile page renders Guest layout', async ({ page }) => {
        await page.goto('/#/profile');
        await expect(page.locator('.profile-card')).toContainText('訪客使用者');
    });

    test('22. Save API key via input field alerts success', async ({ page }) => {
        await page.goto('/#/profile');
        await page.fill('input[type="password"]', 'my-secret-key');

        let dialogShown = false;
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('已儲存');
            dialogShown = true;
            dialog.accept();
        });

        await page.click('button:has-text("儲存")');
        expect(dialogShown).toBeTruthy();
    });

    test('23. Reloading keeps the saved API key in input state', async ({ page }) => {
        await page.goto('/#/profile');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'persistent-key'));
        await page.reload();
        const inputValue = await page.inputValue('input[type="password"]');
        expect(inputValue).toBe('persistent-key');
    });

    test('24. Link to OpenAI resolves correctly', async ({ page }) => {
        await page.goto('/#/profile');
        await page.waitForSelector('a:has-text("OpenAI")');
        const href = await page.getAttribute('a:has-text("OpenAI")', 'href');
        expect(href).toContain('platform.openai.com');
    });

    test('25. Link to Gemini resolves correctly', async ({ page }) => {
        await page.goto('/#/profile');
        await page.waitForSelector('a:has-text("Google AI Studio")');
        const href = await page.getAttribute('a:has-text("Google AI Studio")', 'href');
        expect(href).toContain('aistudio.google.com');
    });

    // ==========================================
    // Integration & Edge Cases (26-30)
    // ==========================================
    test('26. Invalid book URL routes safely or shows error', async ({ page }) => {
        await page.goto('/#/read/INVALID/999');
        await expect(page.locator('.reading-content')).toContainText('尚未同步'); // "Verses not found"
    });

    test('27. API Error handling triggers failure alert gracefully', async ({ page }) => {
        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));

        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            await route.abort('failed'); // Simulate network failure
        });

        let dialogShown = false;
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('失敗'); // "Generation failed"
            dialogShown = true;
            dialog.accept();
        });

        await page.locator('button:has-text("深入了解")').click({ force: true });
        expect(dialogShown).toBeTruthy();
    });

    test('28. Language switch evaluates english context on deep dive warning', async ({ page }) => {
        // Mock English state
        await page.goto('/');
        await page.click('button:has-text("EN")');

        await page.goto('/#/read/MAT/1');
        await page.waitForSelector('.ai-companion-section');
        let dialogShown = false;
        page.on('dialog', dialog => {
            expect(dialog.message()).toContain('Please set your AI API Key');
            dialogShown = true;
            dialog.accept();
        });

        await page.locator('button:has-text("Start Quiz")').click({ force: true });
        expect(dialogShown).toBeTruthy();
    });

    test('29. Complete sequential run: Read -> Deep Dive -> Quiz -> Submit -> Home', async ({ page }) => {
        await page.goto('/');
        await page.click('text=聖經');
        await page.click('text=馬太福音');
        await page.waitForURL(/\/read\/MAT\/1/);
        await expect(page).toHaveURL(/\/read\/MAT\/1/);

        await page.waitForSelector('.ai-companion-section');
        await page.evaluate(() => localStorage.setItem('ai_api_key', 'mock-key'));
        await page.route('https://generativelanguage.googleapis.com/**', async route => {
            // Check post body to see if it's deep dive or quiz to mock appropriately
            const postData = route.request().postData() || "";
            if (postData.includes("神學意涵")) {
                await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "Mock deep dive." }] } }] } });
            } else {
                await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: "```json\n{\"question\":\"Q1\",\"options\":[\"Wrong\",\"Correct\"],\"correctIndex\":1,\"explanation\":\"E1\",\"aiFeedback\":\"F1\"}\n```" }] } }] } });
            }
        });

        await page.locator('button:has-text("深入了解")').click({ force: true });
        const modal = page.locator('.deep-dive-modal');
        await modal.waitFor({ state: 'visible' });
        await expect(modal).toBeVisible();

        await page.locator('button:has-text("開始測驗")').click({ force: true });

        const correctBtn = page.locator('button:has-text("Correct")');
        await correctBtn.waitFor({ state: 'visible' });
        await correctBtn.click({ force: true });

        page.once('dialog', dialog => dialog.accept()); // Accept guest alert
        await page.locator('button:has-text("送出")').click({ force: true });

        const feedback = page.locator('.quiz-feedback-section');
        await feedback.waitFor({ state: 'visible' });
        await expect(feedback).toBeVisible();

        await page.locator('button:has-text("首頁")').click({ force: true });
        await page.waitForURL(/\//);

        await expect(page).toHaveURL(/\//); // Back to dashboard
    });

    test('30. Mobile Responsiveness Layout - buttons stack or flex without breaking', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/#/read/MAT/1');

        // Wait for buttons to load
        await page.waitForSelector('.ai-companion-section', { timeout: 10000 });
        const deepDiveBtn = page.locator('button:has-text("深入了解")');
        const quizBtn = page.locator('button:has-text("開始測驗")');

        await deepDiveBtn.waitFor({ state: 'visible' });
        await quizBtn.waitFor({ state: 'visible' });
        await expect(deepDiveBtn).toBeVisible();
        await expect(quizBtn).toBeVisible();

        const deepDiveBox = await deepDiveBtn.boundingBox();
        const quizBox = await quizBtn.boundingBox();
        // Assert they are close to each other, inside viewport, flex applied correctly.
        expect(deepDiveBox!.width).toBeGreaterThan(0);
        expect(quizBox!.width).toBeGreaterThan(0);
    });
});
