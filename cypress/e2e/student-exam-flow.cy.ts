/// <reference types="cypress" />

/**
 * E2E Test: Student Happy Path
 * 
 * This test validates the complete student journey:
 * 1. Join a live demo exam
 * 2. Confirm identity
 * 3. Answer exam questions
 * 4. Submit exam
 * 5. View results
 * 
 * NOTE: This test requires the dev server to be running (npm run dev)
 * and uses the Live Demo feature which doesn't require authentication.
 */

describe('Student Exam Flow - Happy Path', () => {

    // Test data
    const studentName = 'Cypress Test Student';
    const classId = 'demo-class-' + Date.now();
    const examId = '7e1dde1d-f4836a3f-1b31-4c43-8ba8-a0617d8a1f90'; // Real exam from database

    beforeEach(() => {
        // Clear any previous session data
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('should complete full exam journey from login to submission', () => {
        // STEP 1: Navigate to Live Demo as Professor to start exam
        cy.visit('/apps/demo');

        // Wait for demo page to load
        cy.contains('Demonstração ao Vivo', { timeout: 10000 }).should('be.visible');

        // Start a new demo session
        cy.contains('button', /Iniciar Nova Demonstração/i).click();

        // Select an exam (assuming there's a demo exam available)
        cy.get('[data-testid="exam-selector"]', { timeout: 5000 })
            .should('be.visible')
            .click();

        // Select first exam from dropdown
        cy.get('[role="option"]').first().click();

        // Start the session
        cy.contains('button', /Liberar Entrada/i).click();

        // Wait for QR code to appear (session is active)
        cy.get('img[alt*="QR"]', { timeout: 10000 }).should('be.visible');

        // Get the student URL from the page
        cy.url().then((professorUrl) => {
            // Extract classId from URL if needed
            const urlParams = new URLSearchParams(professorUrl.split('?')[1]);
            const actualClassId = urlParams.get('classId') || classId;

            // STEP 2: Open student view in same browser (simulating student joining)
            cy.visit(`/apps/demo?mode=mobile&role=STUDENT&classId=${actualClassId}&examId=${examId}`);

            // STEP 3: Student Login Screen
            cy.contains('Conectar à Turma', { timeout: 10000 }).should('be.visible');

            // Enter student name
            cy.get('input[placeholder*="João Silva"]').type(studentName, { force: true });

            // Click join button
            cy.contains('button', /Entrar na Sala/i).click();

            // STEP 4: Confirm Identity
            cy.contains(`Bem-vindo(a), ${studentName.split(' ')[0]}!`, { timeout: 10000 })
                .should('be.visible');

            // Click start exam with force to bypass any "Safe Mode" overlay issues
            cy.contains('button', /Iniciar Prova/i).click({ force: true });

            // STEP 5: Answer Questions
            // Wait for first question to load
            cy.get('[data-testid="question-statement"]', { timeout: 10000 })
                .should('be.visible');

            // Answer first question (click first alternative)
            cy.get('[data-testid="alternative-option"]').first().click();

            // Check if there's a next button or if it's the last question
            cy.get('body').then(($body) => {
                if ($body.find('button:contains("Próxima")').length > 0) {
                    // Multi-question exam - navigate through questions
                    cy.contains('button', /Próxima/i).click();

                    // Answer second question if it exists
                    cy.get('[data-testid="alternative-option"]', { timeout: 5000 })
                        .first()
                        .click();
                }
            });

            // STEP 6: Submit Exam
            cy.contains('button', /Entregar Prova/i, { timeout: 10000 })
                .should('be.visible')
                .click();

            // Confirm submission if there's a confirmation dialog
            cy.get('body').then(($body) => {
                if ($body.find('button:contains("Confirmar")').length > 0) {
                    cy.contains('button', /Confirmar/i).click();
                }
            });

            // STEP 7: Verify Success Screen
            cy.contains(/Prova Finalizada|Prova Entregue/i, { timeout: 15000 })
                .should('be.visible');

            // Verify score is displayed (may be 0 if answers were wrong, but should exist)
            cy.contains(/Pontuação|Nota|Acertos/i).should('be.visible');
        });
    });

    it('should handle network interruption gracefully', () => {
        // This test validates offline functionality
        // USE REAL EXAM ID from previous test to avoid "Exam Not Found" error
        cy.visit(`/apps/demo?mode=mobile&role=STUDENT&classId=test-class&examId=${examId}`);

        // Join exam
        // Force type to handle overlays/animations or "Modo Seguro" modal
        cy.get('input[placeholder*="João Silva"]').type('Offline Test Student', { force: true });
        cy.contains('button', /Entrar na Sala/i).click({ force: true });

        // Wait for identity confirmation
        cy.contains(/Bem-vindo/i, { timeout: 10000 }).should('be.visible');
        cy.contains('button', /Iniciar Prova/i).click({ force: true });

        // Wait for question to load
        cy.get('[data-testid="question-statement"]', { timeout: 10000 }).should('be.visible');

        // Simulate offline mode
        cy.window().then((win) => {
            // Trigger offline event
            win.dispatchEvent(new Event('offline'));
        });

        // Answer should still be saved locally
        cy.get('[data-testid="alternative-option"]').first().click({ force: true });

        // Verify offline indicator appears
        cy.contains(/Offline|Sem conexão/i, { timeout: 5000 }).should('be.visible');

        // Restore online mode
        cy.window().then((win) => {
            win.dispatchEvent(new Event('online'));
        });

        // Verify online indicator
        cy.contains(/Online|Conectado/i, { timeout: 5000 }).should('be.visible');
    });

    after(() => {
        // Cleanup: Could add API calls here to clean up test data if needed
        cy.log('Test completed - cleanup if necessary');
    });
});
