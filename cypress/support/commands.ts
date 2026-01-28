/// <reference types="cypress" />

// ***********************************************
// Custom commands for ExamePad E2E tests
// ***********************************************

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to login as admin
             * @example cy.loginAsAdmin('admin@escola.com', 'password123')
             */
            loginAsAdmin(email: string, password: string): Chainable<void>;

            /**
             * Custom command to join exam as student
             * @example cy.joinExamAsStudent('João Silva', 'classId', 'examId')
             */
            joinExamAsStudent(name: string, classId: string, examId: string): Chainable<void>;
        }
    }
}

Cypress.Commands.add('loginAsAdmin', (email: string, password: string) => {
    cy.visit('/');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.contains('button', /Entrar na Plataforma/i).click();
    cy.url().should('not.include', '/login');
});

Cypress.Commands.add('joinExamAsStudent', (name: string, classId: string, examId: string) => {
    cy.visit(`/apps/demo?mode=mobile&role=STUDENT&classId=${classId}&examId=${examId}`);
    cy.get('input[placeholder*="João Silva"]').type(name);
    cy.contains('button', /Entrar na Sala/i).click();
});

export { };
